import pytest
from datetime import datetime, timezone

from models import Paper, PaperStatusEnum, Review
from services.review_queries import review_response_with_context

from conftest import make_paper, user_by_email

pytestmark = pytest.mark.asyncio


async def test_review_response_with_context_includes_paper_and_conference(db_session):
    author = await user_by_email(db_session, "author@test.local")
    reviewer = await user_by_email(db_session, "organizer@test.local")
    paper = make_paper(author.id, title="Context Paper")
    paper.status = PaperStatusEnum.UNDER_REVIEW
    db_session.add(paper)
    await db_session.flush()
    await db_session.refresh(paper, attribute_names=["conference"])

    review = Review(paper_id=paper.id, reviewer_id=reviewer.id, submitted_at=datetime.now(timezone.utc))
    db_session.add(review)
    await db_session.flush()
    review.paper = paper
    review.paper.conference = paper.conference

    response = review_response_with_context(review, reviewer_name=reviewer.full_name)

    assert response.paper_title == "Context Paper"
    assert response.conference_id == paper.conference_id
    assert response.conference_title == paper.conference.title
    assert response.review_deadline == paper.conference.review_deadline
    assert response.reviewer_name == reviewer.full_name
