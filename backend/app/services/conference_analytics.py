from datetime import datetime, timedelta, timezone

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Conference, ConferenceRegistration, Paper, PaperStatusEnum, Review
from schemas import ConferenceAnalyticsResponse, SubmissionDayCount


async def build_conference_analytics(
    db: AsyncSession,
    conference: Conference,
) -> ConferenceAnalyticsResponse:
    conference_id = conference.id
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)

    status_columns = [
        func.sum(case((Paper.status == status, 1), else_=0)).label(status.value)
        for status in PaperStatusEnum
    ]
    counts_row = (
        await db.execute(
            select(func.count(Paper.id).label("papers_count"), *status_columns).where(
                Paper.conference_id == conference_id
            )
        )
    ).one()

    papers_count = int(counts_row.papers_count or 0)
    status_breakdown = {
        status.value: int(getattr(counts_row, status.value) or 0) for status in PaperStatusEnum
    }
    status_breakdown = {key: value for key, value in status_breakdown.items() if value > 0}

    reviewer_assigned, reviewer_completed, registrations_count = (
        await db.execute(
            select(
                select(func.count())
                .select_from(Review)
                .join(Paper, Review.paper_id == Paper.id)
                .where(Paper.conference_id == conference_id)
                .scalar_subquery()
                .label("reviewer_assigned"),
                select(func.count())
                .select_from(Review)
                .join(Paper, Review.paper_id == Paper.id)
                .where(Paper.conference_id == conference_id, Review.recommendation.isnot(None))
                .scalar_subquery()
                .label("reviewer_completed"),
                select(func.count())
                .select_from(ConferenceRegistration)
                .where(ConferenceRegistration.conference_id == conference_id)
                .scalar_subquery()
                .label("registrations_count"),
            )
        )
    ).one()

    day_rows = await db.execute(
        select(func.date(Paper.submitted_at), func.count())
        .where(
            Paper.conference_id == conference_id,
            Paper.submitted_at.isnot(None),
            Paper.submitted_at >= cutoff,
        )
        .group_by(func.date(Paper.submitted_at))
        .order_by(func.date(Paper.submitted_at))
    )
    submissions_by_day = [
        SubmissionDayCount(date=str(day), count=count) for day, count in day_rows.all()
    ]

    return ConferenceAnalyticsResponse(
        submissions_by_day=submissions_by_day,
        status_breakdown=status_breakdown,
        reviewer_assigned=int(reviewer_assigned or 0),
        reviewer_completed=int(reviewer_completed or 0),
        registrations_count=int(registrations_count or 0),
        papers_count=papers_count,
    )
