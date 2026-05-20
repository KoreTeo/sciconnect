from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from constants import REVIEW_CONFLICT_DECLARED_CODE, REVIEW_CONFLICT_DECLARED_DETAIL
from errors import coded_http_exception
from models import Conference, ConferenceReviewer, Paper, PaperStatusEnum, Review, User
from schemas import ReviewAssignmentResponse, ReviewAssignmentReviewer, ReviewerAssign, ReviewerResponse
from services.conference_access import ensure_conference_managed
from services.notification_delivery import notify_user


def _deadline_passed(deadline: datetime) -> bool:
    now = datetime.now(timezone.utc)
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    return deadline < now


async def list_review_assignments(
    db: AsyncSession,
    conference: Conference,
    *,
    track_ids: list[int] | None = None,
) -> list[ReviewAssignmentResponse]:
    query = (
        select(Paper)
        .where(Paper.conference_id == conference.id)
        .options(selectinload(Paper.author), selectinload(Paper.reviews).selectinload(Review.reviewer))
        .order_by(Paper.id.desc())
    )
    if track_ids is not None:
        query = query.where(Paper.track_id.in_(track_ids))
    result = await db.execute(query)
    papers = result.scalars().all()
    deadline_passed = _deadline_passed(conference.review_deadline)
    assignments: list[ReviewAssignmentResponse] = []
    for paper in papers:
        reviewers = [
            ReviewAssignmentReviewer(
                review_id=review.id,
                reviewer_id=review.reviewer_id,
                reviewer_name=review.reviewer.full_name if review.reviewer else None,
                reviewer_email=review.reviewer.email if review.reviewer else None,
                recommendation=review.recommendation.value if review.recommendation else None,
                submitted_at=review.submitted_at,
                updated_at=review.updated_at,
                is_completed=review.recommendation is not None,
                is_overdue=deadline_passed and review.recommendation is None,
            )
            for review in paper.reviews
        ]
        completed = sum(1 for reviewer in reviewers if reviewer.is_completed)
        assignments.append(
            ReviewAssignmentResponse(
                paper_id=paper.id,
                paper_title=paper.title,
                paper_status=paper.status.value if hasattr(paper.status, "value") else paper.status,
                author_name=paper.author.full_name if paper.author else None,
                assigned_reviewers=reviewers,
                completed_reviews=completed,
                pending_reviews=len(reviewers) - completed,
                is_overdue=deadline_passed and any(not reviewer.is_completed for reviewer in reviewers),
            )
        )
    return assignments


async def add_conference_reviewer(
    db: AsyncSession,
    conference_id: int,
    user_id: int,
) -> dict[str, str]:
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    existing = await db.execute(
        select(ConferenceReviewer).where(
            ConferenceReviewer.conference_id == conference_id,
            ConferenceReviewer.user_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Рецензент уже добавлен")

    db.add(ConferenceReviewer(conference_id=conference_id, user_id=user_id))
    return {"message": "Рецензент добавлен в пул конференции"}


async def remove_conference_reviewer(
    db: AsyncSession,
    conference_id: int,
    user_id: int,
) -> None:
    result = await db.execute(
        select(ConferenceReviewer).where(
            ConferenceReviewer.conference_id == conference_id,
            ConferenceReviewer.user_id == user_id,
        )
    )
    pool_entry = result.scalar_one_or_none()
    if not pool_entry:
        raise HTTPException(status_code=404, detail="Рецензент не в пуле")
    await db.delete(pool_entry)


async def list_conference_reviewers(
    db: AsyncSession,
    conference_id: int,
) -> list[ReviewerResponse]:
    result = await db.execute(
        select(ConferenceReviewer, User)
        .join(User, ConferenceReviewer.user_id == User.id)
        .where(ConferenceReviewer.conference_id == conference_id)
    )
    return [
        ReviewerResponse(id=pool_entry.id, user_id=user.id, full_name=user.full_name, email=user.email)
        for pool_entry, user in result.all()
    ]


async def assign_reviewer_to_paper(
    db: AsyncSession,
    conference: Conference,
    data: ReviewerAssign,
) -> dict[str, str]:
    pool = await db.execute(
        select(ConferenceReviewer).where(
            ConferenceReviewer.conference_id == conference.id,
            ConferenceReviewer.user_id == data.user_id,
        )
    )
    if not pool.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Пользователь не в пуле рецензентов")

    paper_result = await db.execute(
        select(Paper).where(Paper.id == data.paper_id, Paper.conference_id == conference.id)
    )
    paper = paper_result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Статья не найдена")

    existing = await db.execute(
        select(Review).where(
            Review.paper_id == data.paper_id,
            Review.reviewer_id == data.user_id,
        )
    )
    prior = existing.scalar_one_or_none()
    if prior:
        if prior.conflict_declared:
            raise coded_http_exception(
                status_code=400,
                code=REVIEW_CONFLICT_DECLARED_CODE,
                message=REVIEW_CONFLICT_DECLARED_DETAIL,
            )
        raise HTTPException(status_code=400, detail="Рецензент уже назначен на эту статью")

    reviewer_result = await db.execute(select(User).where(User.id == data.user_id))
    reviewer = reviewer_result.scalar_one_or_none()

    review = Review(paper_id=data.paper_id, reviewer_id=data.user_id)
    db.add(review)

    if paper.status in (PaperStatusEnum.SUBMITTED, PaperStatusEnum.REVISION_REQUIRED):
        paper.status = PaperStatusEnum.UNDER_REVIEW

    if reviewer:
        await notify_user(
            db,
            user_id=reviewer.id,
            user=reviewer,
            title="Назначена рецензия",
            message=f'Вам назначена статья «{paper.title}» на конференции «{conference.title}»',
            link=f"/reviews/{paper.id}",
            email_subject=f"Назначена рецензия: {paper.title}",
            email_body=f'Вам назначена статья «{paper.title}» на конференции «{conference.title}».',
            entity_type="review",
            entity_id=paper.id,
        )

    return {"message": "Рецензент назначен на статью"}


async def unassign_review(
    db: AsyncSession,
    review: Review,
    current_user: User,
) -> None:
    if not review.paper or not review.paper.conference:
        raise HTTPException(status_code=404, detail="Рецензия не найдена")
    await ensure_conference_managed(db, review.paper.conference, current_user)
    if review.recommendation is not None:
        raise HTTPException(status_code=400, detail="Нельзя снять назначение после отправки рецензии")
    await db.delete(review)
