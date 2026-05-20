import pytest
from sqlalchemy import select

from constants import PAYMENT_REQUIRED_CODE, PAYMENT_REQUIRED_DETAIL
from models import Conference, ConferenceRegistration, Paper, PaperStatusEnum, Payment, PaymentStatusEnum

from conftest import auth_headers, user_by_email

pytestmark = pytest.mark.asyncio


async def _fee_conference(db_session) -> Conference:
    result = await db_session.execute(select(Conference).where(Conference.id == 1))
    conf = result.scalar_one()
    conf.fee_required = True
    conf.registration_fee = 100
    conf.submission_fee = 500
    await db_session.commit()
    await db_session.refresh(conf)
    return conf


async def test_submit_blocked_without_payment(client, db_session):
    await _fee_conference(db_session)
    author = await user_by_email(db_session, "author@test.local")
    paper = Paper(
        conference_id=1,
        author_id=author.id,
        title="Fee gate paper",
        abstract="Long enough abstract for submission gate testing.",
        keywords=["fee"],
        status=PaperStatusEnum.DRAFT,
        file_url="/uploads/test.pdf",
        file_name="test.pdf",
    )
    db_session.add(paper)
    await db_session.commit()
    await db_session.refresh(paper)

    headers = await auth_headers(db_session, "author@test.local")
    blocked = await client.post(f"/papers/{paper.id}/submit", headers=headers)
    assert blocked.status_code == 402
    detail = blocked.json()["detail"]
    assert detail["code"] == PAYMENT_REQUIRED_CODE
    assert detail["message"] == PAYMENT_REQUIRED_DETAIL

    payment_res = await client.post(
        "/payments/create",
        headers=headers,
        json={"conference_id": 1, "paper_id": paper.id, "purpose": "submission"},
    )
    assert payment_res.status_code == 200
    payment = payment_res.json()
    confirm = await client.post(f"/payments/{payment['id']}/confirm", headers=headers)
    assert confirm.status_code == 200

    submitted = await client.post(f"/papers/{paper.id}/submit", headers=headers)
    assert submitted.status_code == 200
    assert submitted.json()["status"] == "submitted"


async def test_register_pending_until_payment(client, db_session):
    await _fee_conference(db_session)
    headers = await auth_headers(db_session, "author@test.local")

    response = await client.post(
        "/conferences/1/register",
        headers=headers,
        json={"registration_type": "listener", "accept_terms": True},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "pending"

    payment_res = await client.post(
        "/payments/create",
        headers=headers,
        json={"conference_id": 1, "registration_id": body["id"], "purpose": "registration"},
    )
    assert payment_res.status_code == 200
    payment = payment_res.json()
    confirm = await client.post(f"/payments/{payment['id']}/confirm", headers=headers)
    assert confirm.status_code == 200

    reg_result = await db_session.execute(
        select(ConferenceRegistration).where(ConferenceRegistration.id == body["id"])
    )
    registration = reg_result.scalar_one()
    assert registration.status.value == "confirmed"

    payment_row = await db_session.get(Payment, payment["id"])
    assert payment_row.status == PaymentStatusEnum.PAID
