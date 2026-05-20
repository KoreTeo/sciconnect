from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from constants import PAYMENT_REQUIRED_CODE, PAYMENT_REQUIRED_DETAIL
from errors import coded_http_exception
from models import Conference, Payment, PaymentStatusEnum
from services.payment_pricing import fee_required_for_purpose


async def has_paid_payment(
    db: AsyncSession,
    *,
    user_id: int,
    conference_id: int,
    purpose: str,
    paper_id: int | None = None,
    registration_id: int | None = None,
) -> bool:
    query = select(Payment).where(
        Payment.user_id == user_id,
        Payment.conference_id == conference_id,
        Payment.status == PaymentStatusEnum.PAID,
        Payment.purpose == purpose,
    )
    if paper_id is not None:
        query = query.where(Payment.paper_id == paper_id)
    if registration_id is not None:
        query = query.where(Payment.registration_id == registration_id)
    result = await db.execute(query.limit(1))
    return result.scalar_one_or_none() is not None


async def require_paid_or_free(
    db: AsyncSession,
    conference: Conference,
    user_id: int,
    purpose: str,
    *,
    paper_id: int | None = None,
    registration_id: int | None = None,
) -> None:
    if not fee_required_for_purpose(conference, purpose):
        return
    if await has_paid_payment(
        db,
        user_id=user_id,
        conference_id=conference.id,
        purpose=purpose,
        paper_id=paper_id,
        registration_id=registration_id,
    ):
        return
    raise coded_http_exception(
        status_code=402,
        code=PAYMENT_REQUIRED_CODE,
        message=PAYMENT_REQUIRED_DETAIL,
    )
