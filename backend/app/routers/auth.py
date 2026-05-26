import secrets
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import User
from models import RoleEnum
from schemas import (
    UserCreate,
    UserOrganizerCreate,
    UserLogin,
    Token,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
)
from auth import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from config import settings
from dependencies import get_current_user
from services.cache import cache_get, cache_set, cache_delete
from services.email import send_password_reset_email
from services.email_verification import send_user_verification_email, verify_email_token
from services.rate_limit import require_rate_limit


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Set HttpOnly auth cookies on the response."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        path="/auth/refresh",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/", samesite="lax")
    response.delete_cookie("refresh_token", path="/auth/refresh", samesite="lax")

router = APIRouter(prefix="/auth", tags=["Аутентификация"])


async def _register_user(db: AsyncSession, user: User) -> User:
    db.add(user)
    await db.commit()
    await db.refresh(user)
    await send_user_verification_email(user)
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, request: Request, db: AsyncSession = Depends(get_db)):
    await require_rate_limit(request, "auth:register", limit=10, window_seconds=60)
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email уже зарегистрирован")

    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        affiliation=user_data.affiliation,
        orcid=user_data.orcid,
        phone=user_data.phone,
        position=user_data.position,
        country=user_data.country,
        role=RoleEnum.USER,
        email_verified=False,
    )
    return await _register_user(db, new_user)


@router.post("/register/organizer", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_organizer(user_data: UserOrganizerCreate, request: Request, db: AsyncSession = Depends(get_db)):
    await require_rate_limit(request, "auth:register-organizer", limit=10, window_seconds=60)
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email уже зарегистрирован")

    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        affiliation=user_data.organization,
        phone=user_data.phone,
        position=user_data.position,
        role=RoleEnum.ORGANIZER,
        email_verified=False,
    )
    return await _register_user(db, new_user)


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    await require_rate_limit(request, "auth:login", limit=100, window_seconds=60)
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Аккаунт деактивирован")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    _set_auth_cookies(response, access_token, refresh_token)
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
async def refresh_token(
    response: Response,
    db: AsyncSession = Depends(get_db),
    cookie_rt: Optional[str] = Cookie(None, alias="refresh_token"),
):
    if not cookie_rt:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token отсутствует")
    payload = decode_token(cookie_rt)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный refresh token")
    user_id = int(payload.get("sub", 0))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    _set_auth_cookies(response, access_token, new_refresh_token)
    return Token(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/logout")
async def logout(response: Response):
    _clear_auth_cookies(response)
    return {"message": "Выход выполнен"}


@router.post("/verify-email", response_model=UserResponse)
async def verify_email(body: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    user = await verify_email_token(db, body.token)
    if not user:
        raise HTTPException(status_code=400, detail="Недействительный или просроченный токен подтверждения")
    return user


@router.post("/resend-verification")
async def resend_verification(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await require_rate_limit(request, "auth:resend-verification", limit=5, window_seconds=300)
    if current_user.email_verified:
        return {"message": "Email уже подтверждён"}
    await send_user_verification_email(current_user)
    return {"message": "Письмо с подтверждением отправлено"}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    await require_rate_limit(request, "auth:forgot-password", limit=5, window_seconds=300)
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user:
        token = secrets.token_urlsafe(32)
        await cache_set(f"pwd_reset:{token}", str(user.id), ttl=3600)
        await send_password_reset_email(user.email, token)
    return {"message": "Если email зарегистрирован, ссылка отправлена"}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    await require_rate_limit(request, "auth:reset-password", limit=10, window_seconds=300)
    user_id = await cache_get(f"pwd_reset:{body.token}")
    if not user_id:
        raise HTTPException(status_code=400, detail="Недействительный или просроченный токен")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user.password_hash = get_password_hash(body.new_password)
    await db.commit()
    await cache_delete(f"pwd_reset:{body.token}")
    return {"message": "Пароль обновлён"}


@router.get("/debug/verification-token")
async def debug_verification_token(
    email: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Эндпоинт недоступен")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    from services.email_verification import issue_verification_token

    token = await issue_verification_token(user.id)
    return {"token": token, "verify_url": f"{settings.FRONTEND_URL.rstrip('/')}/verify-email?token={token}"}
