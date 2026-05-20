import pytest
from datetime import datetime, timezone

from models import Conference, Paper, PaperStatusEnum, Review, ReviewModeEnum
from services.review_queries import build_review_responses

from conftest import make_paper, user_by_email

pytestmark = pytest.mark.asyncio


async def test_double_blind_masks_reviewer_from_author(db_session):
    author = await user_by_email(db_session, "author@test.local")
    reviewer = await user_by_email(db_session, "organizer@test.local")
    paper = make_paper(author.id, title="Blind paper")
    paper.status = PaperStatusEnum.UNDER_REVIEW
    db_session.add(paper)
    await db_session.flush()

    conf = await db_session.get(Conference, paper.conference_id)
    conf.review_mode = ReviewModeEnum.DOUBLE_BLIND
    await db_session.flush()

    review = Review(
        paper_id=paper.id,
        reviewer_id=reviewer.id,
        submitted_at=datetime.now(timezone.utc),
    )
    review.reviewer = reviewer
    db_session.add(review)
    await db_session.flush()
    await db_session.refresh(paper, attribute_names=["conference"])

    responses = build_review_responses([review], paper=paper, current_user=author)
    assert responses[0].reviewer_name == "Рецензент"


async def test_organizer_sees_reviewer_name_in_blind_mode(db_session):
    author = await user_by_email(db_session, "author@test.local")
    reviewer = await user_by_email(db_session, "organizer@test.local")
    paper = make_paper(author.id, title="Organizer view")
    paper.status = PaperStatusEnum.UNDER_REVIEW
    db_session.add(paper)
    await db_session.flush()

    conf = await db_session.get(Conference, paper.conference_id)
    conf.review_mode = ReviewModeEnum.DOUBLE_BLIND
    await db_session.flush()

    review = Review(
        paper_id=paper.id,
        reviewer_id=reviewer.id,
        submitted_at=datetime.now(timezone.utc),
    )
    review.reviewer = reviewer
    db_session.add(review)
    await db_session.flush()
    await db_session.refresh(paper, attribute_names=["conference"])

    responses = build_review_responses([review], paper=paper, current_user=reviewer)
    assert responses[0].reviewer_name == reviewer.full_name
