import pytest
from sqlalchemy import select

from models import Paper, PaperStatusEnum, ProceedingsEntry

from conftest import auth_headers, user_by_email

pytestmark = pytest.mark.asyncio


async def test_publish_proceedings_requires_entries(client, db_session):
    headers = await auth_headers(db_session, "organizer@test.local")
    response = await client.post("/conferences/1/proceedings/publish", headers=headers)
    assert response.status_code == 400
    assert "Добавьте хотя бы одну статью" in response.json()["detail"]


async def test_add_accepted_paper_and_publish(client, db_session):
    author = await user_by_email(db_session, "author@test.local")
    paper = Paper(
        conference_id=1,
        author_id=author.id,
        title="Accepted proceedings paper",
        abstract="Accepted abstract",
        keywords=["proceedings"],
        status=PaperStatusEnum.ACCEPTED,
    )
    db_session.add(paper)
    await db_session.commit()
    await db_session.refresh(paper)

    headers = await auth_headers(db_session, "organizer@test.local")
    add_response = await client.post(
        "/conferences/1/proceedings/entries",
        headers=headers,
        json={"paper_id": paper.id},
    )
    assert add_response.status_code == 200
    entries_result = await db_session.execute(select(ProceedingsEntry).where(ProceedingsEntry.paper_id == paper.id))
    assert entries_result.scalar_one_or_none() is not None

    publish_response = await client.post("/conferences/1/proceedings/publish", headers=headers)
    assert publish_response.status_code == 200
    published = publish_response.json()
    assert published["is_published"] is True

