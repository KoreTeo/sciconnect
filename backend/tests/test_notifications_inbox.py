import pytest
from httpx import AsyncClient
from models import Notification


@pytest.mark.asyncio
async def test_notifications_unread_filter(client: AsyncClient, db_session):
    from conftest import auth_headers, user_by_email

    author = await user_by_email(db_session, "author@test.local")
    headers = await auth_headers(db_session, "author@test.local")
    db_session.add_all([
        Notification(user_id=author.id, title="A", message="m1", is_read=False),
        Notification(user_id=author.id, title="B", message="m2", is_read=True),
    ])
    await db_session.commit()

    r = await client.get("/notifications/?is_read=false", headers=headers)
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["title"] == "A"


@pytest.mark.asyncio
async def test_notifications_unread_count(client: AsyncClient, db_session):
    from conftest import auth_headers, user_by_email

    author = await user_by_email(db_session, "author@test.local")
    headers = await auth_headers(db_session, "author@test.local")
    db_session.add_all([
        Notification(user_id=author.id, title="A", message="m1", is_read=False),
        Notification(user_id=author.id, title="B", message="m2", is_read=False),
        Notification(user_id=author.id, title="C", message="m3", is_read=True),
    ])
    await db_session.commit()

    r = await client.get("/notifications/unread-count", headers=headers)
    assert r.status_code == 200
    assert r.json()["count"] == 2
