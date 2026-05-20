import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from models import User
from services.notification_delivery import notify_user


@pytest.mark.asyncio
async def test_notification_preferences_disable_email(client: AsyncClient, db_session: AsyncSession):
    user = User(
        email="prefs@test.local",
        password_hash="x",
        full_name="Prefs User",
        notification_preferences={
            "papers": {"email": False, "in_app": True},
            "reviews": {"email": True, "in_app": True},
            "conferences": {"email": True, "in_app": True},
        },
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    dispatched = []

    async def fake_dispatch(job):
        dispatched.append(job)

    import services.notification_delivery as nd

    original = nd.dispatch_email
    nd.dispatch_email = fake_dispatch
    try:
        await notify_user(
            db_session,
            user_id=user.id,
            title="Paper update",
            message="Status changed",
            email_subject="Paper update",
            entity_type="paper",
        )
    finally:
        nd.dispatch_email = original

    assert dispatched == []


@pytest.mark.asyncio
async def test_notification_preferences_disable_in_app(client: AsyncClient, db_session: AsyncSession):
    from models import Notification
    from sqlalchemy import select

    user = User(
        email="prefs2@test.local",
        password_hash="x",
        full_name="Prefs User 2",
        notification_preferences={
            "papers": {"email": True, "in_app": False},
            "reviews": {"email": True, "in_app": True},
            "conferences": {"email": True, "in_app": True},
        },
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    await notify_user(
        db_session,
        user_id=user.id,
        title="Paper update",
        message="Status changed",
        entity_type="paper",
    )

    result = await db_session.execute(
        select(Notification).where(Notification.user_id == user.id)
    )
    assert result.scalars().all() == []


@pytest.mark.asyncio
async def test_get_patch_notification_preferences(client: AsyncClient, db_session):
    from conftest import auth_headers

    headers = await auth_headers(db_session, "author@test.local")
    r = await client.get("/users/me/notification-preferences", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data["papers"]["email"] is True

    r2 = await client.patch(
        "/users/me/notification-preferences",
        headers=headers,
        json={"papers": {"email": False, "in_app": True}},
    )
    assert r2.status_code == 200
    assert r2.json()["papers"]["email"] is False
