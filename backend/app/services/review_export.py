from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Paper, Review, User

REVIEWS_CSV_HEADERS = [
    "review_id",
    "paper_id",
    "paper_title",
    "reviewer_name",
    "reviewer_email",
    "recommendation",
    "score_relevance",
    "score_novelty",
    "score_clarity",
    "score_methodology",
    "submitted_at",
]


async def build_reviews_csv_rows(db: AsyncSession, conference_id: int) -> list[list]:
    result = await db.execute(
        select(Review, Paper, User)
        .join(Paper, Review.paper_id == Paper.id)
        .join(User, Review.reviewer_id == User.id)
        .where(Paper.conference_id == conference_id)
        .order_by(Paper.id, Review.id)
    )
    return [
        [
            review.id,
            paper.id,
            paper.title,
            reviewer.full_name,
            reviewer.email,
            review.recommendation.value if review.recommendation else "",
            review.score_relevance or "",
            review.score_novelty or "",
            review.score_clarity or "",
            review.score_methodology or "",
            review.submitted_at.isoformat() if review.submitted_at else "",
        ]
        for review, paper, reviewer in result.all()
    ]
