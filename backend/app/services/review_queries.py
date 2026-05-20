from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from fastapi import HTTPException

from models import Paper, Review, User
from rbac import ensure_paper_actor
from schemas import ReviewResponse


def review_response_with_context(review: Review, *, reviewer_name: str | None = None) -> ReviewResponse:
    item = ReviewResponse.model_validate(review)
    updates: dict = {}
    if reviewer_name:
        updates["reviewer_name"] = reviewer_name
    if review.paper:
        updates["paper_title"] = review.paper.title
        if review.paper.conference:
            updates["conference_id"] = review.paper.conference_id
            updates["conference_title"] = review.paper.conference.title
            updates["review_deadline"] = review.paper.conference.review_deadline
    if updates:
        item = item.model_copy(update=updates)
    return item


from services.review_visibility import apply_review_visibility, should_mask_author_from_reviewer, mask_author_name


def build_review_responses(
    reviews: list[Review],
    *,
    paper: Paper,
    current_user: User,
) -> list[ReviewResponse]:
    items = []
    for review in reviews:
        item = ReviewResponse.model_validate(review)
        if paper.author_id == current_user.id and review.comment_for_chair:
            item = item.model_copy(update={"comment_for_chair": None})
        reviewer_name = review.reviewer.full_name if review.reviewer else None
        reviewer_name = apply_review_visibility(
            review,
            paper=paper,
            viewer=current_user,
            reviewer_name=reviewer_name,
        )
        if reviewer_name:
            item = item.model_copy(update={"reviewer_name": reviewer_name})
        if review.recommendation:
            item = item.model_copy(
                update={
                    "recommendation": review.recommendation.value
                    if hasattr(review.recommendation, "value")
                    else review.recommendation
                }
            )
        items.append(item)
    return items


async def fetch_my_reviews(
    db: AsyncSession,
    current_user: User,
    *,
    skip: int = 0,
    limit: int = 100,
    paper_id: int | None = None,
) -> list[ReviewResponse]:
    query = (
        select(Review)
        .where(Review.reviewer_id == current_user.id)
        .options(selectinload(Review.paper).selectinload(Paper.conference))
        .order_by(Review.submitted_at.desc())
        .offset(skip)
        .limit(limit)
    )
    if paper_id is not None:
        query = query.where(Review.paper_id == paper_id)
    result = await db.execute(query)
    reviews = result.scalars().all()
    return [
        review_response_with_context(review, reviewer_name=current_user.full_name) for review in reviews
    ]


async def fetch_paper_reviews_for_viewer(
    db: AsyncSession,
    paper_id: int,
    current_user: User,
) -> list[ReviewResponse]:
    paper_result = await db.execute(
        select(Paper)
        .where(Paper.id == paper_id)
        .options(selectinload(Paper.conference), selectinload(Paper.reviews).selectinload(Review.reviewer))
    )
    paper = paper_result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Статья не найдена")

    ensure_paper_actor(paper, current_user)

    result = await db.execute(
        select(Review).where(Review.paper_id == paper_id).options(selectinload(Review.reviewer))
    )
    reviews = list(result.scalars().all())
    return build_review_responses(reviews, paper=paper, current_user=current_user)
