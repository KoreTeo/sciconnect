import pytest

from models import ConferenceRole, ConferenceRoleEnum

from conftest import auth_headers, user_by_email

pytestmark = pytest.mark.asyncio


def _program_payload() -> list[dict]:
    return [
        {
            "title": "Session 1",
            "description": "Main track",
            "room": "A1",
            "start_time": "2026-06-01T09:00:00Z",
            "end_time": "2026-06-01T10:00:00Z",
            "items": [
                {
                    "title": "Talk 1",
                    "authors": "Author",
                    "start_time": "2026-06-01T09:05:00Z",
                    "end_time": "2026-06-01T09:25:00Z",
                    "paper_id": None,
                    "order": 1,
                }
            ],
        }
    ]


async def test_program_update_forbidden_for_non_manager(client, db_session):
    author_headers = await auth_headers(db_session, "author@test.local")
    response = await client.put("/conferences/1/program", headers=author_headers, json=_program_payload())
    assert response.status_code == 403


async def test_program_update_allowed_for_coorganizer(client, db_session):
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
    response = await client.put("/conferences/1/program", headers=headers, json=_program_payload())
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["title"] == "Session 1"
    assert len(body[0]["items"]) == 1

