from typing import Optional

from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from auth import decode_token
from models import User
from config import settings
from constants import EMAIL_NOT_VERIFIED_CODE, EMAIL_NOT_VERIFIED_DETAIL
from errors import coded_http_exception

_optional_bearer = HTTPBearer(auto_error=False)


def _resolve_token(
    credentials: Optional[HTTPAuthorizationCredentials],
    cookie_token: Optional[str],
) -> Optional[str]:
    """Return token from Authorization header, falling back to HttpOnly cookie."""
    if credentials:
        return credentials.credentials
    return cookie_token


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    cookie_token: Optional[str] = Cookie(None, alias="access_token"),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = _resolve_token(credentials, cookie_token)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не аутентифицирован",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный токен",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ID пользователя отсутствует")

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Аккаунт заблокирован")

    return user


async def require_verified_email(current_user: User = Depends(get_current_user)) -> User:
    if settings.EMAIL_VERIFICATION_REQUIRED and not current_user.email_verified:
        raise coded_http_exception(
            status_code=status.HTTP_403_FORBIDDEN,
            code=EMAIL_NOT_VERIFIED_CODE,
            message=EMAIL_NOT_VERIFIED_DETAIL,
        )
    return current_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    cookie_token: Optional[str] = Cookie(None, alias="access_token"),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    token = _resolve_token(credentials, cookie_token)
    if not token:
        return None
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    result = await db.execute(select(User).where(User.id == int(user_id)))
    return result.scalar_one_or_none()
