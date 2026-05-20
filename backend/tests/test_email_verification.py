import pytest

from config import settings
from models import PaperStatusEnum
from services.email_verification import issue_verification_token

from conftest import auth_headers, make_paper, user_by_email


pytestmark = pytest.mark.asyncio


@pytest.fixture
def memory_cache(monkeypatch):
    store: dict[str, str] = {}

    async def _get(key: str):
        return store.get(key)

    async def _set(key: str, value: str, ttl: int = 60):
        store[key] = value

    async def _delete(key: str):
        store.pop(key, None)

    for module in ("services.cache", "services.email_verification", "services.rate_limit"):
        monkeypatch.setattr(f"{module}.cache_get", _get, raising=False)
        monkeypatch.setattr(f"{module}.cache_set", _set, raising=False)
        monkeypatch.setattr(f"{module}.cache_delete", _delete, raising=False)
    return store


async def test_verify_email_sets_flag(client, db_session, memory_cache):
    author = await user_by_email(db_session, "author@test.local")
    author.email_verified = False
    await db_session.commit()

    token = await issue_verification_token(author.id)
    response = await client.post("/auth/verify-email", json={"token": token})

    assert response.status_code == 200
    assert response.json()["email_verified"] is True
    await db_session.refresh(author)
    assert author.email_verified is True


async def test_unverified_user_blocked_from_submit(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "EMAIL_VERIFICATION_REQUIRED", True)
    author = await user_by_email(db_session, "author@test.local")
    author.email_verified = False
    paper = make_paper(author.id, title="Draft for verify gate")
    paper.status = PaperStatusEnum.DRAFT
    paper.submitted_at = None
    db_session.add(paper)
    await db_session.commit()
    await db_session.refresh(paper)

    headers = await auth_headers(db_session, "author@test.local")
    response = await client.post(f"/papers/{paper.id}/submit", headers=headers)

    assert response.status_code == 403
    from constants import EMAIL_NOT_VERIFIED_CODE, EMAIL_NOT_VERIFIED_DETAIL

    detail = response.json()["detail"]
    assert detail["code"] == EMAIL_NOT_VERIFIED_CODE
    assert detail["message"] == EMAIL_NOT_VERIFIED_DETAIL


async def test_resend_verification_rate_limit(client, db_session, memory_cache):
    author = await user_by_email(db_session, "author@test.local")
    author.email_verified = False
    await db_session.commit()
    headers = await auth_headers(db_session, "author@test.local")

    for _ in range(5):
        response = await client.post("/auth/resend-verification", headers=headers)
        assert response.status_code == 200

    blocked = await client.post("/auth/resend-verification", headers=headers)
    assert blocked.status_code == 429
