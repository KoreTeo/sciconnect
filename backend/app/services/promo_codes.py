from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import ConferencePromoCode


async def resolve_promo_code(
    db: AsyncSession,
    conference_id: int,
    promo_code: str | None,
) -> ConferencePromoCode | None:
    if not promo_code or not promo_code.strip():
        return None
    normalized = promo_code.strip().upper()
    result = await db.execute(
        select(ConferencePromoCode).where(
            ConferencePromoCode.conference_id == conference_id,
            ConferencePromoCode.code == normalized,
        )
    )
    promo = result.scalar_one_or_none()
    if not promo:
        raise HTTPException(status_code=400, detail="Промокод не найден или недействителен")
    if not promo.is_active:
        raise HTTPException(status_code=400, detail="Промокод деактивирован")
    if promo.expires_at:
        expires = promo.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="Срок действия промокода истёк")
    if promo.max_uses is not None and (promo.used_count or 0) >= promo.max_uses:
        raise HTTPException(status_code=400, detail="Промокод исчерпан")
    return promo


async def increment_promo_usage(db: AsyncSession, promo: ConferencePromoCode | None) -> None:
    if promo is None:
        return
    promo.used_count = (promo.used_count or 0) + 1
