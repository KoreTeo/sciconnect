from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Conference, Paper, Review
from schemas import ReviewProgressSummary


def _deadline_passed(deadline: datetime) -> bool:
    now = datetime.now(timezone.utc)
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    return deadline < now


async def get_review_progress_summary(
    db: AsyncSession,
    conference: Conference,
) -> ReviewProgressSummary:
    papers_total = await db.scalar(
        select(func.count()).select_from(Paper).where(Paper.conference_id == conference.id)
    ) or 0

    assignments_total = await db.scalar(
        select(func.count())
        .select_from(Review)
        .join(Paper, Review.paper_id == Paper.id)
        .where(Paper.conference_id == conference.id)
    ) or 0

    reviews_completed = await db.scalar(
        select(func.count())
        .select_from(Review)
        .join(Paper, Review.paper_id == Paper.id)
        .where(Paper.conference_id == conference.id, Review.recommendation.isnot(None))
    ) or 0

    reviews_pending = assignments_total - reviews_completed
    overdue = reviews_pending if _deadline_passed(conference.review_deadline) else 0

    return ReviewProgressSummary(
        papers_total=papers_total,
        assignments_total=assignments_total,
        reviews_completed=reviews_completed,
        reviews_pending=reviews_pending,
        reviews_overdue=overdue,
        review_deadline=conference.review_deadline,
    )
