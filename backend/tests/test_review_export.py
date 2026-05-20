import pytest
from datetime import datetime, timezone

from models import Paper, PaperStatusEnum, RecommendationEnum, Review
from services.review_export import REVIEWS_CSV_HEADERS, build_reviews_csv_rows

from conftest import make_paper, user_by_email

pytestmark = pytest.mark.asyncio


async def test_build_reviews_csv_rows_includes_reviewer_and_scores(db_session):
    author = await user_by_email(db_session, "author@test.local")
    reviewer = await user_by_email(db_session, "organizer@test.local")
    paper = make_paper(author.id, title="Reviewed Paper")
    paper.status = PaperStatusEnum.UNDER_REVIEW
    db_session.add(paper)
    await db_session.flush()

    review = Review(
        paper_id=paper.id,
        reviewer_id=reviewer.id,
        recommendation=RecommendationEnum.ACCEPT,
        score_relevance=4,
        score_novelty=5,
        score_clarity=4,
        score_methodology=5,
        submitted_at=datetime(2026, 5, 20, 12, 0, tzinfo=timezone.utc),
    )
    db_session.add(review)
    await db_session.commit()

    rows = await build_reviews_csv_rows(db_session, conference_id=1)

    assert len(rows) == 1
    row = rows[0]
    assert len(row) == len(REVIEWS_CSV_HEADERS)
    assert row[REVIEWS_CSV_HEADERS.index("paper_title")] == "Reviewed Paper"
    assert row[REVIEWS_CSV_HEADERS.index("reviewer_name")] == reviewer.full_name
    assert row[REVIEWS_CSV_HEADERS.index("recommendation")] == RecommendationEnum.ACCEPT.value
    assert row[REVIEWS_CSV_HEADERS.index("score_relevance")] == 4
    assert "2026-05-20" in row[REVIEWS_CSV_HEADERS.index("submitted_at")]
