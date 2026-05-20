from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import ConferenceRegistration, Payment, RegistrationStatusEnum


async def settle_paid_payment(db: AsyncSession, payment: Payment) -> None:
    if payment.registration_id:
        result = await db.execute(
            select(ConferenceRegistration).where(ConferenceRegistration.id == payment.registration_id)
        )
        registration = result.scalar_one_or_none()
        if registration and registration.status == RegistrationStatusEnum.PENDING:
            registration.status = RegistrationStatusEnum.CONFIRMED
