import pytest
from sqlalchemy import select

from models import Conference, ConferenceRole, ConferenceRoleEnum, User

from conftest import auth_headers, token_for, user_by_email


pytestmark = pytest.mark.asyncio


async def test_inactive_user_cannot_access_protected_endpoint(client, db_session):
    user = await user_by_email(db_session, "blocked@test.local")
    token = token_for(user.id, user.role)

    response = await client.get("/users/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403
    assert response.json()["detail"] == "Аккаунт заблокирован"


async def test_author_cannot_manage_conference_papers(client, db_session):
    headers = await auth_headers(db_session, "author@test.local")

    response = await client.get("/papers/conference/1", headers=headers)

    assert response.status_code == 403


async def test_organizer_cannot_update_other_organizer_conference(client, db_session):
    headers = await auth_headers(db_session, "other-organizer@test.local")

    response = await client.put(
        "/conferences/1",
        headers=headers,
        json={"title": "Hijacked Conference"},
    )

    assert response.status_code == 403


async def test_admin_can_access_admin_summary(client, db_session):
    headers = await auth_headers(db_session, "admin@test.local")

    response = await client.get("/admin/summary", headers=headers)

    assert response.status_code == 200
    assert response.json()["users_total"] >= 5


async def test_admin_can_update_any_conference(client, db_session):
    headers = await auth_headers(db_session, "admin@test.local")

    response = await client.put(
        "/conferences/1",
        headers=headers,
        json={"title": "Admin Updated Conference"},
    )

    assert response.status_code == 200
    result = await db_session.execute(select(Conference).where(Conference.id == 1))
    assert result.scalar_one().title == "Admin Updated Conference"


async def test_coorganizer_can_update_conference(client, db_session):
    organizer = await user_by_email(db_session, "organizer@test.local")
    co_organizer = await user_by_email(db_session, "other-organizer@test.local")
    db_session.add(
        ConferenceRole(
            conference_id=1,
            user_id=co_organizer.id,
            role=ConferenceRoleEnum.CO_ORGANIZER,
        )
    )
    await db_session.commit()

    headers = await auth_headers(db_session, "other-organizer@test.local")
    response = await client.put(
        "/conferences/1",
        headers=headers,
        json={"title": "Co Organizer Updated Conference"},
    )

    assert response.status_code == 200
    result = await db_session.execute(select(Conference).where(Conference.id == 1))
    updated = result.scalar_one()
    assert updated.title == "Co Organizer Updated Conference"
    assert updated.organizer_id == organizer.id
