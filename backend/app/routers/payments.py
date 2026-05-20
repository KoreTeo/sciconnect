from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Payment, PaymentStatusEnum, Conference, Paper, ConferenceRegistration, User
from schemas import PaymentCreate, PaymentResponse, PaymentWebhookPayload
from dependencies import get_current_user
from services.payment_providers.registry import get_payment_provider
from services.payment_pricing import apply_promo_discount, base_registration_fee, base_submission_fee, fee_required_for_purpose
from services.promo_codes import increment_promo_usage, resolve_promo_code
from services.payment_settlement import settle_paid_payment

router = APIRouter(prefix="/payments", tags=["Платежи"])


async def _get_owned_payment(db: AsyncSession, payment_id: int, user_id: int) -> Payment:
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment or payment.user_id != user_id:
        raise HTTPException(status_code=404, detail="Платёж не найден")
    return payment


def _payment_to_response(payment: Payment, payment_url: str | None = None) -> PaymentResponse:
    return PaymentResponse(
        id=payment.id,
        conference_id=payment.conference_id,
        amount=float(payment.amount),
        currency=payment.currency,
        status=payment.status.value if hasattr(payment.status, "value") else payment.status,
        provider=payment.provider,
        external_id=payment.external_id,
        payment_url=payment_url,
        purpose=payment.purpose,
        paper_id=payment.paper_id,
        registration_id=payment.registration_id,
        created_at=payment.created_at,
    )


async def _calculate_amount(db: AsyncSession, conf: Conference, data: PaymentCreate) -> tuple[Decimal, object | None]:
    if data.purpose == "submission":
        amount = base_submission_fee(conf)
    elif data.purpose == "registration":
        amount = base_registration_fee(conf)
    elif conf.fee_required:
        amount = base_registration_fee(conf) if conf.registration_fee else base_submission_fee(conf)
    else:
        amount = Decimal("0")

    promo = await resolve_promo_code(db, conf.id, data.promo_code)
    if promo:
        amount = apply_promo_discount(
            amount,
            discount_percent=Decimal(str(promo.discount_percent or 0)),
            discount_fixed=Decimal(str(promo.discount_fixed or 0)),
        )
    return amount, promo


@router.post("/create", response_model=PaymentResponse)
async def create_payment(
    data: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Conference).where(Conference.id == data.conference_id))
    conf = result.scalar_one_or_none()
    if not conf:
        raise HTTPException(status_code=404, detail="Конференция не найдена")

    amount, promo = await _calculate_amount(db, conf, data)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Оплата не требуется для этого действия")

    if data.paper_id:
        result = await db.execute(select(Paper).where(Paper.id == data.paper_id))
        paper = result.scalar_one_or_none()
        if not paper or paper.author_id != current_user.id or paper.conference_id != data.conference_id:
            raise HTTPException(status_code=404, detail="Статья не найдена")

    if data.registration_id:
        result = await db.execute(select(ConferenceRegistration).where(ConferenceRegistration.id == data.registration_id))
        registration = result.scalar_one_or_none()
        if (
            not registration
            or registration.user_id != current_user.id
            or registration.conference_id != data.conference_id
        ):
            raise HTTPException(status_code=404, detail="Регистрация не найдена")

    provider = get_payment_provider()
    payment_init = provider.create_payment(
        amount,
        "RUB",
        metadata={"purpose": data.purpose, "user_id": current_user.id},
    )
    payment = Payment(
        user_id=current_user.id,
        conference_id=data.conference_id,
        paper_id=data.paper_id,
        registration_id=data.registration_id,
        amount=amount,
        currency="RUB",
        status=PaymentStatusEnum.PENDING,
        provider=payment_init.provider,
        external_id=payment_init.external_id,
        purpose=data.purpose,
    )
    db.add(payment)
    await increment_promo_usage(db, promo)
    await db.commit()
    await db.refresh(payment)
    return _payment_to_response(payment, payment_init.payment_url)


@router.post("/{payment_id}/confirm", response_model=PaymentResponse)
async def confirm_payment_demo(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = await _get_owned_payment(db, payment_id, current_user.id)
    provider = get_payment_provider(payment.provider)
    if provider.name != "demo":
        raise HTTPException(status_code=400, detail="Для этого провайдера требуется внешняя оплата")
    provider.mark_paid(payment)
    await settle_paid_payment(db, payment)
    await db.commit()
    await db.refresh(payment)
    return _payment_to_response(payment)


@router.post("/webhook/{provider_name}", response_model=PaymentResponse)
async def payment_webhook(
    provider_name: str,
    payload: PaymentWebhookPayload,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    provider = get_payment_provider(provider_name)
    webhook = provider.parse_webhook(payload.model_dump(), dict(request.headers))
    result = await db.execute(
        select(Payment).where(
            Payment.external_id == webhook.external_id,
            Payment.provider == provider.name,
        )
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Платёж не найден")
    if webhook.status != PaymentStatusEnum.PAID.value:
        payment.status = PaymentStatusEnum.FAILED
    else:
        provider.mark_paid(payment)
        await settle_paid_payment(db, payment)
    await db.commit()
    await db.refresh(payment)
    return _payment_to_response(payment)


@router.post("/webhook/demo", response_model=PaymentResponse)
async def demo_payment_webhook(
    payload: PaymentWebhookPayload,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    return await payment_webhook("demo", payload, request, db)


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = await _get_owned_payment(db, payment_id, current_user.id)
    return _payment_to_response(payment)
