import pytest

from config import settings
from constants import (
    EMAIL_NOT_VERIFIED_CODE,
    EMAIL_NOT_VERIFIED_DETAIL,
    REGISTRATION_PROFILE_AFFILIATION_REQUIRED_CODE,
    REGISTRATION_PROFILE_AFFILIATION_REQUIRED_DETAIL,
    REGISTRATION_TERMS_REQUIRED_CODE,
    REGISTRATION_TERMS_REQUIRED_DETAIL,
)

from conftest import auth_headers, user_by_email


pytestmark = pytest.mark.asyncio


async def test_register_conference_requires_accept_terms(client, db_session):
    headers = await auth_headers(db_session, "author@test.local")
    response = await client.post(
        "/conferences/1/register",
        headers=headers,
        json={"registration_type": "listener", "accept_terms": False},
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["code"] == REGISTRATION_TERMS_REQUIRED_CODE
    assert detail["message"] == REGISTRATION_TERMS_REQUIRED_DETAIL


async def test_register_conference_requires_affiliation(client, db_session):
    author = await user_by_email(db_session, "author@test.local")
    author.affiliation = "   "
    await db_session.commit()
    headers = await auth_headers(db_session, "author@test.local")

    response = await client.post(
        "/conferences/1/register",
        headers=headers,
        json={"registration_type": "listener", "accept_terms": True},
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["code"] == REGISTRATION_PROFILE_AFFILIATION_REQUIRED_CODE
    assert detail["message"] == REGISTRATION_PROFILE_AFFILIATION_REQUIRED_DETAIL


async def test_register_conference_as_author(client, db_session):
    headers = await auth_headers(db_session, "author@test.local")
    response = await client.post(
        "/conferences/1/register",
        headers=headers,
        json={"registration_type": "author", "accept_terms": True},
    )
    assert response.status_code == 200
    assert response.json()["registration_type"] == "author"


async def test_register_conference_requires_verified_email(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "EMAIL_VERIFICATION_REQUIRED", True)
    author = await user_by_email(db_session, "author@test.local")
    author.email_verified = False
    await db_session.commit()
    headers = await auth_headers(db_session, "author@test.local")

    response = await client.post(
        "/conferences/1/register",
        headers=headers,
        json={"registration_type": "listener", "accept_terms": True},
    )
    assert response.status_code == 403
    detail = response.json()["detail"]
    assert detail["code"] == EMAIL_NOT_VERIFIED_CODE
    assert detail["message"] == EMAIL_NOT_VERIFIED_DETAIL


async def test_update_profile_country(client, db_session):
    headers = await auth_headers(db_session, "author@test.local")
    response = await client.put("/users/me", headers=headers, json={"country": "RU"})
    assert response.status_code == 200
    assert response.json()["country"] == "RU"


async def test_update_profile_invalid_country(client, db_session):
    headers = await auth_headers(db_session, "author@test.local")
    response = await client.put("/users/me", headers=headers, json={"country": "XXX"})
    assert response.status_code == 422
