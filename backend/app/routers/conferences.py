import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from database import get_db
from models import (
    AdminAuditLog,
    Conference,
    ConferenceTrack,
    ConferenceRole,
    User,
    RoleEnum,
    ConferenceStatusEnum,
)
from queries.conferences import (
    conference_short_name_exists,
    get_conference_by_short_name_or_404,
    get_conference_or_404,
    list_conferences,
)
from schemas import (
    ConferenceApprovalSubmit,
    ConferenceCreate,
    ConferenceUpdate,
    ConferenceResponse,
    ConferenceAnalyticsResponse,
    BulkPaperRevisionRequestCreate,
    BulkPaperRevisionResponse,
    BulkRevisionSkipped,
    ConferenceTrackCreate,
    ConferenceTrackResponse,
    ConferenceRoleCreate,
    ConferenceRoleResponse,
    ConferenceManageAccessResponse,
)
from dependencies import get_current_user, get_optional_user
from rbac import has_role, require_organizer_or_admin
from services.cache import cache_get, cache_set, cache_delete_pattern
from services.conference_access import ensure_conference_managed, get_conference_paper_access, get_managed_conference
from services.conference_analytics import build_conference_analytics
from services.notification_delivery import UserNotificationSpec, notify_users
from services.paper_workflow import bulk_request_paper_revision, paper_responses_with_revision_context

router = APIRouter(prefix="/conferences", tags=["Конференции"])


def _audit_conference(db: AsyncSession, actor: User, action: str, conference: Conference, before: dict, after: dict) -> None:
    db.add(
        AdminAuditLog(
            actor_id=actor.id,
            action=action,
            entity_type="conference",
            entity_id=conference.id,
            before=before,
            after=after,
        )
    )


@router.get("/", response_model=list[ConferenceResponse])
async def get_conferences(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[ConferenceStatusEnum] = Query(None, alias="status"),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"conferences:{status_filter}:{search}:{skip}:{limit}"
    cached = await cache_get(cache_key)
    if cached:
        return json.loads(cached)

    query = select(Conference)
    if status_filter:
        query = query.where(Conference.status == status_filter)
    else:
        query = query.where(Conference.status != ConferenceStatusEnum.DRAFT)
    if search:
        query = query.where(
            or_(
                Conference.title.ilike(f"%{search}%"),
                Conference.short_name.ilike(f"%{search}%"),
            )
        )
    query = query.order_by(Conference.start_date.desc()).offset(skip).limit(limit)
    conferences = await list_conferences(db, query)
    data = [ConferenceResponse.model_validate(c).model_dump(mode="json") for c in conferences]
    await cache_set(cache_key, json.dumps(data, default=str), ttl=60)
    return conferences


@router.get("/by-short-name/{short_name}", response_model=ConferenceResponse)
async def get_conference_by_short_name(short_name: str, db: AsyncSession = Depends(get_db)):
    return await get_conference_by_short_name_or_404(db, short_name)


@router.get("/{conference_id}", response_model=ConferenceResponse)
async def get_conference(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    conference = await get_conference_or_404(db, conference_id)
    is_owner = current_user and conference.organizer_id == current_user.id
    is_admin = current_user and has_role(current_user, RoleEnum.ADMIN)
    if conference.status == ConferenceStatusEnum.DRAFT and not is_owner and not is_admin:
        raise HTTPException(status_code=404, detail="Конференция не найдена")
    return conference


@router.post("/", response_model=ConferenceResponse, status_code=status.HTTP_201_CREATED)
async def create_conference(
    conference_data: ConferenceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    if conference_data.short_name:
        if await conference_short_name_exists(db, conference_data.short_name):
            raise HTTPException(status_code=400, detail="Краткое имя уже занято")

    if conference_data.start_date > conference_data.end_date:
        raise HTTPException(status_code=400, detail="Дата начала не может быть позже даты окончания")

    now_utc = datetime.now(timezone.utc)
    if conference_data.submission_deadline < now_utc:
        raise HTTPException(status_code=400, detail="Дедлайн подачи не может быть в прошлом")
    if conference_data.review_deadline < conference_data.submission_deadline:
        raise HTTPException(status_code=400, detail="Дедлайн рецензирования не может быть раньше дедлайна подачи")

    new_conference = Conference(
        organizer_id=current_user.id,
        status=ConferenceStatusEnum.DRAFT,
        **conference_data.model_dump(),
    )
    db.add(new_conference)
    await db.commit()
    await db.refresh(new_conference)
    await cache_delete_pattern("conferences:")
    return new_conference


@router.post("/{conference_id}/submit-for-approval", response_model=ConferenceResponse)
async def submit_conference_for_approval(
    conference_id: int,
    data: ConferenceApprovalSubmit | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    conference = await get_conference_or_404(db, conference_id)
    await ensure_conference_managed(db, conference, current_user)
    if conference.status not in (ConferenceStatusEnum.DRAFT, ConferenceStatusEnum.REJECTED):
        raise HTTPException(status_code=400, detail="На модерацию можно отправить только черновик или возвращённую конференцию")

    before = {"status": conference.status.value, "moderation_comment": conference.moderation_comment}
    conference.status = ConferenceStatusEnum.PENDING_APPROVAL
    conference.moderation_comment = data.comment if data and data.comment else None
    conference.moderated_by = None
    conference.moderated_at = None
    after = {"status": conference.status.value, "moderation_comment": conference.moderation_comment}
    _audit_conference(db, current_user, "submit_conference_for_approval", conference, before, after)

    admin_result = await db.execute(select(User).where(User.role == RoleEnum.ADMIN, User.is_active == True))
    admins = list(admin_result.scalars().all())
    if admins:
        await notify_users(
            db,
            [
                UserNotificationSpec(
                    user_id=admin.id,
                    user=admin,
                    title="Конференция на модерации",
                    message=f'Конференция «{conference.title}» ожидает проверки',
                    link="/admin",
                    email_subject=f"Конференция на модерации: {conference.title}",
                    email_body=f"Конференция «{conference.title}» ожидает проверки администратором.",
                    entity_type="conference",
                    entity_id=conference.id,
                )
                for admin in admins
            ],
        )

    await db.commit()
    await db.refresh(conference)
    await cache_delete_pattern("conferences:")
    return conference


@router.put("/{conference_id}", response_model=ConferenceResponse)
async def update_conference(
    conference_id: int,
    conference_data: ConferenceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conference = await get_conference_or_404(db, conference_id)
    await ensure_conference_managed(
        db,
        conference,
        current_user,
        detail="Только организатор может редактировать",
    )

    payload = conference_data.model_dump(exclude_unset=True)
    if not has_role(current_user, RoleEnum.ADMIN):
        payload.pop("status", None)
        payload.pop("moderation_comment", None)
        payload.pop("moderated_by", None)
        payload.pop("moderated_at", None)
        if conference.status == ConferenceStatusEnum.PENDING_APPROVAL:
            raise HTTPException(status_code=400, detail="Конференция на модерации, редактирование временно недоступно")

    for field, value in payload.items():
        setattr(conference, field, value)

    await db.commit()
    await db.refresh(conference)
    await cache_delete_pattern("conferences:")
    return conference


@router.delete("/{conference_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conference(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    conference = await get_conference_or_404(db, conference_id)
    await ensure_conference_managed(db, conference, current_user)
    await db.delete(conference)
    await db.commit()
    await cache_delete_pattern("conferences:")


@router.get("/my/list", response_model=list[ConferenceResponse])
async def get_my_conferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conference).where(Conference.organizer_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/{conference_id}/analytics", response_model=ConferenceAnalyticsResponse)
async def conference_analytics(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conference = await get_managed_conference(db, conference_id, current_user)
    return await build_conference_analytics(db, conference)


@router.post("/{conference_id}/papers/bulk-request-revision", response_model=BulkPaperRevisionResponse)
async def bulk_request_paper_revision_endpoint(
    conference_id: int,
    data: BulkPaperRevisionRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await get_managed_conference(db, conference_id, current_user)
    updated_papers, skipped_items = await bulk_request_paper_revision(
        db,
        conference_id,
        data.paper_ids,
        data.comment,
        current_user,
    )
    await db.commit()
    updated_responses = await paper_responses_with_revision_context(db, updated_papers)
    return BulkPaperRevisionResponse(
        updated=updated_responses,
        skipped=[BulkRevisionSkipped(paper_id=paper_id, reason=reason) for paper_id, reason in skipped_items],
    )


@router.get("/{conference_id}/manage-access", response_model=ConferenceManageAccessResponse)
async def conference_manage_access(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _, track_ids = await get_conference_paper_access(db, conference_id, current_user)
    if track_ids is None:
        return ConferenceManageAccessResponse(access="full", track_ids=None)
    return ConferenceManageAccessResponse(access="tracks", track_ids=track_ids)


@router.get("/{conference_id}/tracks", response_model=list[ConferenceTrackResponse])
async def list_conference_tracks(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ConferenceTrack).where(ConferenceTrack.conference_id == conference_id))
    return result.scalars().all()


@router.post("/{conference_id}/tracks", response_model=ConferenceTrackResponse, status_code=status.HTTP_201_CREATED)
async def create_conference_track(
    conference_id: int,
    data: ConferenceTrackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await get_managed_conference(db, conference_id, current_user)
    track = ConferenceTrack(conference_id=conference_id, **data.model_dump())
    db.add(track)
    await db.commit()
    await db.refresh(track)
    return track


@router.get("/{conference_id}/roles", response_model=list[ConferenceRoleResponse])
async def list_conference_roles(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await get_managed_conference(db, conference_id, current_user)
    result = await db.execute(select(ConferenceRole).where(ConferenceRole.conference_id == conference_id))
    return result.scalars().all()


@router.post("/{conference_id}/roles", response_model=ConferenceRoleResponse, status_code=status.HTTP_201_CREATED)
async def create_conference_role(
    conference_id: int,
    data: ConferenceRoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await get_managed_conference(db, conference_id, current_user)
    role = ConferenceRole(conference_id=conference_id, **data.model_dump())
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role
