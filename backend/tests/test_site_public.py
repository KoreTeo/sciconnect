import pytest
from datetime import datetime, timezone

from models import (
    ConferenceSite,
    Paper,
    PaperStatusEnum,
    ProceedingsEntry,
    ProceedingsIssue,
    ProgramItem,
    ProgramSession,
)

from conftest import user_by_email

pytestmark = pytest.mark.asyncio


async def test_public_conference_payload_includes_site_program_and_proceedings(client, db_session):
    author = await user_by_email(db_session, "author@test.local")

    site = ConferenceSite(
        conference_id=1,
        is_published=True,
        theme_json={"hero_title": "Public conference"},
    )
    db_session.add(site)
    await db_session.flush()

    session = ProgramSession(
        conference_id=1,
        title="Program session",
        start_time=datetime(2026, 6, 1, 9, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 6, 1, 10, 0, tzinfo=timezone.utc),
        room="A1",
    )
    db_session.add(session)
    await db_session.flush()
    db_session.add(
        ProgramItem(
            session_id=session.id,
            title="Program talk",
            authors="Author",
            start_time=datetime(2026, 6, 1, 9, 5, tzinfo=timezone.utc),
            end_time=datetime(2026, 6, 1, 9, 25, tzinfo=timezone.utc),
            order=1,
        )
    )

    paper = Paper(
        conference_id=1,
        author_id=author.id,
        title="Public proceedings paper",
        abstract="Proceedings abstract",
        keywords=["site"],
        file_url="/uploads/test.pdf",
        status=PaperStatusEnum.ACCEPTED,
    )
    db_session.add(paper)
    await db_session.flush()

    issue = ProceedingsIssue(
        conference_id=1,
        title="Issue 1",
        is_published=True,
    )
    db_session.add(issue)
    await db_session.flush()
    db_session.add(
        ProceedingsEntry(
            issue_id=issue.id,
            paper_id=paper.id,
            order=1,
            published_title=paper.title,
            published_abstract=paper.abstract,
        )
    )
    await db_session.commit()

    response = await client.get("/conferences/public/managed")
    assert response.status_code == 200
    body = response.json()
    assert body["site"]["is_published"] is True
    assert len(body["program"]) == 1
    assert body["program"][0]["title"] == "Program session"
    assert body["proceedings"]["is_published"] is True
    assert len(body["proceedings"]["entries"]) == 1

