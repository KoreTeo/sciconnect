import pytest

from models import (
    ConferenceReviewer,
    PaperStatusEnum,
    Review,
)
from conftest import auth_headers, make_paper, make_paper_version, make_revision_request, user_by_email

pytestmark = pytest.mark.asyncio


async def test_my_papers_pagination_and_revision_metadata(client, db_session):
    author = await user_by_email(db_session, "author@test.local")
    headers = await auth_headers(db_session, "author@test.local")

    papers = [make_paper(author.id, title=f"Performance Paper {index}") for index in range(3)]
    db_session.add_all(papers)
    await db_session.flush()
    db_session.add_all(
        [
            make_paper_version(papers[2], author.id, 1),
            make_paper_version(papers[2], author.id, 2),
            make_revision_request(papers[2], author.id, 2, "Latest revision comment"),
            make_revision_request(papers[2], author.id, 1, "Older revision comment"),
        ]
    )
    await db_session.commit()

    response = await client.get("/papers/my?skip=0&limit=1", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == papers[2].id
    assert data[0]["version_count"] == 2
    assert data[0]["latest_revision_comment"] == "Latest revision comment"
    assert data[0]["latest_revision_round"] == 2


async def test_my_papers_query_count_contract(client, db_session, query_counter):
    author = await user_by_email(db_session, "author@test.local")
    headers = await auth_headers(db_session, "author@test.local")
    db_session.add_all([make_paper(author.id, title=f"Paper {index}") for index in range(10)])
    await db_session.commit()

    query_counter["count"] = 0
    response = await client.get("/papers/my?skip=0&limit=10", headers=headers)

    assert response.status_code == 200
    assert len(response.json()) == 10
    assert query_counter["count"] <= 4


async def test_review_assignments_query_count_contract(client, db_session, query_counter):
    author = await user_by_email(db_session, "author@test.local")
    organizer = await user_by_email(db_session, "organizer@test.local")
    headers = await auth_headers(db_session, "organizer@test.local")

    paper = make_paper(author.id, title="Assigned Paper")
    paper.status = PaperStatusEnum.UNDER_REVIEW
    db_session.add(paper)
    await db_session.flush()
    db_session.add(ConferenceReviewer(conference_id=1, user_id=organizer.id))
    db_session.add(Review(paper_id=paper.id, reviewer_id=organizer.id))
    await db_session.commit()

    query_counter["count"] = 0
    response = await client.get("/conferences/1/review-assignments", headers=headers)

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert query_counter["count"] <= 6


async def test_conference_analytics_query_count_contract(client, db_session, query_counter):
    headers = await auth_headers(db_session, "organizer@test.local")

    query_counter["count"] = 0
    response = await client.get("/conferences/1/analytics", headers=headers)

    assert response.status_code == 200
    assert "papers_count" in response.json()
    assert query_counter["count"] <= 10


async def test_submit_paper_query_count_contract(client, db_session, query_counter):
    author = await user_by_email(db_session, "author@test.local")
    headers = await auth_headers(db_session, "author@test.local")

    paper = make_paper(author.id, title="Draft Paper")
    paper.status = PaperStatusEnum.DRAFT
    paper.file_url = "/uploads/test.pdf"
    db_session.add(paper)
    await db_session.commit()

    query_counter["count"] = 0
    response = await client.post(f"/papers/{paper.id}/submit", headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "submitted"
    assert query_counter["count"] <= 11
