import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import User
from services.cache import cache_delete, cache_get, cache_set
from services.email import send_verification_email

VERIFY_TTL_SECONDS = 24 * 60 * 60


async def issue_verification_token(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    await cache_set(f"email_verify:{token}", str(user_id), ttl=VERIFY_TTL_SECONDS)
    return token


async def send_user_verification_email(user: User) -> None:
    token = await issue_verification_token(user.id)
    await send_verification_email(user.email, token)


async def verify_email_token(db: AsyncSession, token: str) -> User | None:
    user_id = await cache_get(f"email_verify:{token}")
    if not user_id:
        return None
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        return None
    user.email_verified = True
    await db.commit()
    await db.refresh(user)
    await cache_delete(f"email_verify:{token}")
    return user
