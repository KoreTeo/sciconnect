from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from models import Paper, Review
from schemas import PaperDecision, ReviewCreate, ReviewUpdate
from services.notification_delivery import notify_user


from constants import REVIEW_CONFLICT_DECLARED_CODE, REVIEW_CONFLICT_DECLARED_DETAIL
from errors import coded_http_exception


def ensure_review_deadline_open(paper) -> None:
    if paper.conference and paper.conference.review_deadline < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Дедлайн рецензирования истёк")


def ensure_review_not_conflict(review: Review) -> None:
    if review.conflict_declared:
        raise coded_http_exception(
            status_code=400,
            code=REVIEW_CONFLICT_DECLARED_CODE,
            message=REVIEW_CONFLICT_DECLARED_DETAIL,
        )


def apply_review_submission(review: Review, data: ReviewCreate) -> None:
    ensure_review_not_conflict(review)
    review.score_relevance = data.score_relevance
    review.score_novelty = data.score_novelty
    review.score_clarity = data.score_clarity
    review.score_methodology = data.score_methodology
    review.comment_for_author = data.comment_for_author
    review.comment_for_chair = data.comment_for_chair
    review.recommendation = data.recommendation
    review.updated_at = datetime.now(timezone.utc)


def apply_review_patch(review: Review, data: ReviewUpdate) -> None:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(review, field, value)


async def apply_paper_decision(db: AsyncSession, paper: Paper, decision: PaperDecision) -> Paper:
    paper.status = decision.status
    if paper.author:
        await notify_user(
            db,
            user_id=paper.author_id,
            user=paper.author,
            title="Решение по статье",
            message=f'Статус статьи «{paper.title}»: {decision.status.value}',
            link=f"/papers/{paper.id}",
            email_subject=f"Решение по статье: {paper.title}",
            email_body=f'Статус статьи «{paper.title}»: {decision.status.value}',
            entity_type="paper",
            entity_id=paper.id,
        )
    return paper
