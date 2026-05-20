from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import (
    Conference,
    ConferenceStatusEnum,
    Paper,
    PaperRevisionRequest,
    PaperStatusEnum,
    PaperVersion,
    User,
)
from schemas import PaperCreate, PaperResponse, PaperRevisionRequestCreate
from services.notification_delivery import UserNotificationSpec, notify_user, notify_users
from services.paper_authors import sync_co_authors


async def next_version_number(db: AsyncSession, paper_id: int) -> int:
    result = await db.execute(
        select(func.coalesce(func.max(PaperVersion.version_number), 0)).where(PaperVersion.paper_id == paper_id)
    )
    return int(result.scalar_one() or 0) + 1


async def create_paper_version(
    db: AsyncSession,
    paper: Paper,
    user_id: int,
    submitted_at: datetime | None = None,
) -> PaperVersion:
    version = PaperVersion(
        paper_id=paper.id,
        version_number=await next_version_number(db, paper.id),
        file_url=paper.file_url,
        file_name=paper.file_name,
        title=paper.title,
        abstract=paper.abstract,
        keywords=paper.keywords or [],
        submitted_at=submitted_at,
        created_by=user_id,
    )
    db.add(version)
    return version


def validate_conference_accepts_submissions(conference: Conference) -> None:
    if conference.status != ConferenceStatusEnum.SUBMISSION_OPEN:
        raise HTTPException(status_code=400, detail="Конференция не принимает статьи в данный момент")
    if conference.submission_deadline < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Дедлайн подачи статей истёк")


def validate_author_not_organizer(conference: Conference, user_id: int) -> None:
    if conference.organizer_id == user_id:
        raise HTTPException(
            status_code=400,
            detail="Организатор не может подавать статью на свою конференцию",
        )


async def create_paper(
    db: AsyncSession,
    conference: Conference,
    paper_data: PaperCreate,
    author: User,
) -> Paper:
    validate_conference_accepts_submissions(conference)
    validate_author_not_organizer(conference, author.id)

    new_paper = Paper(
        conference_id=conference.id,
        author_id=author.id,
        track_id=paper_data.track_id,
        title=paper_data.title,
        abstract=paper_data.abstract,
        keywords=paper_data.keywords,
        status=PaperStatusEnum.DRAFT,
    )
    db.add(new_paper)
    await db.flush()
    if paper_data.co_authors:
        await sync_co_authors(db, new_paper.id, paper_data.co_authors)
    return new_paper


async def submit_paper(db: AsyncSession, paper: Paper, author: User) -> Paper:
    if paper.author_id != author.id:
        raise HTTPException(status_code=403, detail="Только автор может подать статью")
    if not paper.file_url:
        raise HTTPException(status_code=400, detail="Сначала загрузите файл статьи")
    if not paper.abstract or len(paper.abstract.strip()) < 20:
        raise HTTPException(status_code=400, detail="Заполните аннотацию (не менее 20 символов) перед подачей")
    if paper.status not in (PaperStatusEnum.DRAFT, PaperStatusEnum.REVISION_REQUIRED):
        raise HTTPException(status_code=400, detail=f"Нельзя подать статью со статусом {paper.status.value}")

    conf_result = await db.execute(select(Conference).where(Conference.id == paper.conference_id))
    conference = conf_result.scalar_one_or_none()
    if conference:
        from services.payment_gates import require_paid_or_free

        await require_paid_or_free(
            db,
            conference,
            author.id,
            "submission",
            paper_id=paper.id,
        )

    now = datetime.now(timezone.utc)
    paper.status = PaperStatusEnum.SUBMITTED
    paper.submitted_at = now

    revision_result = await db.execute(
        select(PaperRevisionRequest)
        .where(PaperRevisionRequest.paper_id == paper.id, PaperRevisionRequest.resolved_at.is_(None))
        .order_by(PaperRevisionRequest.round_number.desc())
        .limit(1)
    )
    revision_request = revision_result.scalar_one_or_none()
    if revision_request:
        revision_request.resolved_at = now

    version_result = await db.execute(
        select(PaperVersion)
        .where(PaperVersion.paper_id == paper.id, PaperVersion.file_url == paper.file_url)
        .order_by(PaperVersion.version_number.desc())
        .limit(1)
    )
    latest_version = version_result.scalar_one_or_none()
    if latest_version and latest_version.submitted_at is None:
        latest_version.submitted_at = now
    else:
        await create_paper_version(db, paper, author.id, submitted_at=now)

    await notify_user(
        db,
        user_id=author.id,
        user=author,
        title="Статья подана",
        message=f'Статья «{paper.title}» отправлена на рецензирование',
        link=f"/papers/{paper.id}",
        entity_type="paper",
        entity_id=paper.id,
    )
    if paper.conference and paper.conference.organizer:
        await notify_user(
            db,
            user_id=paper.conference.organizer_id,
            user=paper.conference.organizer,
            title="Новая статья",
            message=f'Автор подал статью «{paper.title}» на конференцию «{paper.conference.title}»',
            link=f"/conference-manage/{paper.conference_id}",
            email_subject=f"Новая статья: {paper.title}",
            email_body=f'Автор подал статью «{paper.title}» на конференцию «{paper.conference.title}».',
            entity_type="paper",
            entity_id=paper.id,
        )
    return paper


async def withdraw_paper(db: AsyncSession, paper: Paper, author: User) -> Paper:
    if paper.author_id != author.id:
        raise HTTPException(status_code=403, detail="Только автор может отозвать статью")
    if paper.status in (PaperStatusEnum.ACCEPTED, PaperStatusEnum.DRAFT):
        raise HTTPException(status_code=400, detail="Нельзя отозвать статью в текущем статусе")
    paper.status = PaperStatusEnum.DRAFT
    return paper


async def request_paper_revision(
    db: AsyncSession,
    paper: Paper,
    data: PaperRevisionRequestCreate,
    requester: User,
    *,
    notify: bool = True,
) -> Paper:
    if not paper.conference:
        raise HTTPException(status_code=404, detail="Статья не найдена")
    if paper.status in (PaperStatusEnum.ACCEPTED, PaperStatusEnum.REJECTED, PaperStatusEnum.DRAFT):
        raise HTTPException(status_code=400, detail="Нельзя запросить доработку в текущем статусе")

    unresolved = await db.execute(
        select(PaperRevisionRequest).where(
            PaperRevisionRequest.paper_id == paper.id,
            PaperRevisionRequest.resolved_at.is_(None),
        )
    )
    if unresolved.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="По статье уже есть активный запрос доработки")

    round_result = await db.execute(
        select(func.coalesce(func.max(PaperRevisionRequest.round_number), 0)).where(
            PaperRevisionRequest.paper_id == paper.id
        )
    )
    round_number = int(round_result.scalar_one() or 0) + 1
    revision_request = PaperRevisionRequest(
        paper_id=paper.id,
        requested_by=requester.id,
        comment=data.comment,
        round_number=round_number,
    )
    db.add(revision_request)
    paper.status = PaperStatusEnum.REVISION_REQUIRED

    if notify and paper.author:
        await notify_user(
            db,
            user_id=paper.author_id,
            user=paper.author,
            title="Требуется доработка статьи",
            message=f'По статье «{paper.title}» запрошена доработка: {data.comment}',
            link=f"/papers/{paper.id}",
            email_subject=f"Требуется доработка: {paper.title}",
            email_body=f'По статье «{paper.title}» запрошена доработка.\n\nКомментарий: {data.comment}',
            entity_type="paper",
            entity_id=paper.id,
        )
    return paper


async def bulk_request_paper_revision(
    db: AsyncSession,
    conference_id: int,
    paper_ids: list[int],
    comment: str,
    requester: User,
) -> tuple[list[Paper], list[tuple[int, str]]]:
    unique_ids = list(dict.fromkeys(paper_ids))
    if not unique_ids:
        return [], []

    result = await db.execute(
        select(Paper)
        .where(Paper.id.in_(unique_ids), Paper.conference_id == conference_id)
        .options(selectinload(Paper.conference), selectinload(Paper.author))
    )
    papers_by_id = {paper.id: paper for paper in result.scalars().all()}
    data = PaperRevisionRequestCreate(comment=comment)
    updated: list[Paper] = []
    skipped: list[tuple[int, str]] = []

    for paper_id in unique_ids:
        paper = papers_by_id.get(paper_id)
        if not paper:
            skipped.append((paper_id, "Статья не найдена в конференции"))
            continue
        try:
            await request_paper_revision(db, paper, data, requester, notify=False)
            updated.append(paper)
        except HTTPException as exc:
            detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
            skipped.append((paper_id, detail))

    if updated:
        await notify_users(
            db,
            [
                UserNotificationSpec(
                    user_id=paper.author_id,
                    user=paper.author,
                    title="Требуется доработка статьи",
                    message=f'По статье «{paper.title}» запрошена доработка: {comment}',
                    link=f"/papers/{paper.id}",
                    email_subject=f"Требуется доработка: {paper.title}",
                    email_body=f'По статье «{paper.title}» запрошена доработка.\n\nКомментарий: {comment}',
                    entity_type="paper",
                    entity_id=paper.id,
                )
                for paper in updated
                if paper.author
            ],
        )

    return updated, skipped


async def load_paper_for_submit(db: AsyncSession, paper_id: int) -> Paper | None:
    result = await db.execute(
        select(Paper)
        .where(Paper.id == paper_id)
        .options(selectinload(Paper.conference).selectinload(Conference.organizer))
    )
    return result.scalar_one_or_none()


async def paper_response_with_revision_context(db: AsyncSession, paper: Paper) -> PaperResponse:
    responses = await paper_responses_with_revision_context(db, [paper])
    return responses[0]


async def paper_responses_with_revision_context(db: AsyncSession, papers: list[Paper]) -> list[PaperResponse]:
    if not papers:
        return []

    paper_ids = [paper.id for paper in papers]
    counts_result = await db.execute(
        select(PaperVersion.paper_id, func.count(PaperVersion.id))
        .where(PaperVersion.paper_id.in_(paper_ids))
        .group_by(PaperVersion.paper_id)
    )
    version_counts = {paper_id: int(count) for paper_id, count in counts_result.all()}

    revision_result = await db.execute(
        select(PaperRevisionRequest)
        .where(PaperRevisionRequest.paper_id.in_(paper_ids))
        .order_by(PaperRevisionRequest.paper_id, PaperRevisionRequest.round_number.desc())
    )
    latest_revisions: dict[int, PaperRevisionRequest] = {}
    for revision in revision_result.scalars().all():
        latest_revisions.setdefault(revision.paper_id, revision)

    responses = []
    for paper in papers:
        latest_revision = latest_revisions.get(paper.id)
        responses.append(
            PaperResponse.model_validate(paper).model_copy(
                update={
                    "version_count": version_counts.get(paper.id, 0),
                    "latest_revision_comment": latest_revision.comment if latest_revision else None,
                    "latest_revision_round": latest_revision.round_number if latest_revision else None,
                }
            )
        )
    return responses
