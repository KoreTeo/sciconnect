from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import User, Conference, RoleEnum, ConferenceStatusEnum
from schemas import (
    AdminAuditLogResponse,
    AdminSummary,
    ConferenceModerationAction,
    UserResponse,
    UserAdminUpdate,
    ConferenceResponse,
    ConferenceUpdate,
)
from dependencies import get_current_user
from rbac import ensure_admin
from services.cache import cache_delete_pattern
from services.admin_dashboard import add_audit_change, build_admin_summary, query_audit_log, query_conferences, query_users
from services.conference_moderation import apply_moderation_action
from services.notification_delivery import notify_user

router = APIRouter(prefix="/admin", tags=["Администрирование"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    return ensure_admin(current_user)


@router.get("/summary", response_model=AdminSummary)
async def get_admin_summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await build_admin_summary(db)


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    q: str | None = Query(None),
    role: RoleEnum | None = Query(None),
    is_active: bool | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await query_users(db, q=q, role=role, is_active=is_active, skip=skip, limit=limit)


@router.get("/audit-log", response_model=list[AdminAuditLogResponse])
async def list_audit_log(
    entity_type: str | None = Query(None),
    actor_id: int | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await query_audit_log(db, entity_type=entity_type, actor_id=actor_id, skip=skip, limit=limit)


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserAdminUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.id == current_admin.id:
        if data.is_active is False:
            raise HTTPException(status_code=400, detail="Нельзя заблокировать собственную учётную запись")
        if data.role is not None and data.role != RoleEnum.ADMIN:
            raise HTTPException(status_code=400, detail="Нельзя снять роль администратора с самого себя")
    before = {
        "role": user.role,
        "is_active": user.is_active,
    }
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    after = {
        "role": user.role,
        "is_active": user.is_active,
    }
    if before != after:
        add_audit_change(
            db,
            actor_id=current_admin.id,
            action="update_user",
            entity_type="user",
            entity_id=user.id,
            before=before,
            after=after,
        )
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/conferences", response_model=list[ConferenceResponse])
async def list_all_conferences(
    q: str | None = Query(None),
    status: ConferenceStatusEnum | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return await query_conferences(db, q=q, status=status, skip=skip, limit=limit)


@router.patch("/conferences/{conference_id}", response_model=ConferenceResponse)
async def admin_update_conference(
    conference_id: int,
    data: ConferenceUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    result = await db.execute(select(Conference).where(Conference.id == conference_id))
    conf = result.scalar_one_or_none()
    if not conf:
        raise HTTPException(status_code=404, detail="Конференция не найдена")
    before = {
        "title": conf.title,
        "short_name": conf.short_name,
        "status": conf.status,
    }
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(conf, field, value)
    after = {
        "title": conf.title,
        "short_name": conf.short_name,
        "status": conf.status,
    }
    if before != after:
        add_audit_change(
            db,
            actor_id=current_admin.id,
            action="update_conference",
            entity_type="conference",
            entity_id=conf.id,
            before=before,
            after=after,
        )
    await db.commit()
    await db.refresh(conf)
    return conf


@router.post("/conferences/{conference_id}/moderate", response_model=ConferenceResponse)
async def moderate_conference(
    conference_id: int,
    data: ConferenceModerationAction,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    result = await db.execute(select(Conference).where(Conference.id == conference_id))
    conf = result.scalar_one_or_none()
    if not conf:
        raise HTTPException(status_code=404, detail="Конференция не найдена")
    before, after = apply_moderation_action(conf, data.action, data.comment, current_admin)
    add_audit_change(
        db,
        actor_id=current_admin.id,
        action=f"moderate_conference_{data.action}",
        entity_type="conference",
        entity_id=conf.id,
        before=before,
        after=after,
    )
    await notify_user(
        db,
        user_id=conf.organizer_id,
        title="Результат модерации конференции",
        message=f'Конференция «{conf.title}»: {conf.status.value}',
        link="/my-conferences",
        email_subject=f"Модерация конференции: {conf.title}",
        email_body=f"Конференция «{conf.title}»: {conf.status.value}.",
        entity_type="conference",
        entity_id=conf.id,
    )
    await db.commit()
    await db.refresh(conf)
    await cache_delete_pattern("conferences:")
    return conf
