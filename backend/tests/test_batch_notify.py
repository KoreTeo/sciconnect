import pytest
from sqlalchemy import select

from models import Notification, User
from services.notification_delivery import UserNotificationSpec, notify_users

pytestmark = pytest.mark.asyncio


async def test_notify_users_bulk_in_app_and_email(db_session, monkeypatch):
    user_a = User(email="bulk-a@test.local", password_hash="x", full_name="Bulk A")
    user_b = User(email="bulk-b@test.local", password_hash="x", full_name="Bulk B")
    db_session.add_all([user_a, user_b])
    await db_session.commit()
    await db_session.refresh(user_a)
    await db_session.refresh(user_b)

    dispatched = []

    async def fake_dispatch(job):
        dispatched.append(job)

    import services.notification_delivery as nd

    original = nd.dispatch_email
    nd.dispatch_email = fake_dispatch
    try:
        await notify_users(
            db_session,
            [
                UserNotificationSpec(
                    user_id=user_a.id,
                    user=user_a,
                    title="Bulk A",
                    message="Message A",
                    email_subject="Subject A",
                    entity_type="paper",
                ),
                UserNotificationSpec(
                    user_id=user_b.id,
                    user=user_b,
                    title="Bulk B",
                    message="Message B",
                    email_subject="Subject B",
                    entity_type="paper",
                ),
            ],
        )
        await db_session.commit()
    finally:
        nd.dispatch_email = original

    result = await db_session.execute(select(Notification).order_by(Notification.user_id))
    notifications = result.scalars().all()
    assert len(notifications) == 2
    assert {n.user_id for n in notifications} == {user_a.id, user_b.id}
    assert len(dispatched) == 2
    assert {job.to for job in dispatched} == {user_a.email, user_b.email}


async def test_notify_users_empty_specs_noop(db_session, monkeypatch):
    called = False

    async def fake_dispatch(job):
        nonlocal called
        called = True

    import services.notification_delivery as nd

    original = nd.dispatch_email
    nd.dispatch_email = fake_dispatch
    try:
        await notify_users(db_session, [])
    finally:
        nd.dispatch_email = original

    assert called is False
