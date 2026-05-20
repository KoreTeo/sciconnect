from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from schemas import (
    UserResponse,
    UserUpdate,
    PasswordChange,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    NotificationChannelPrefs,
)
from services.notification_preferences import merge_preferences_update, normalize_preferences
from dependencies import get_current_user
from models import User, RoleEnum
from auth import verify_password, get_password_hash
from rbac import has_role

router = APIRouter(prefix="/users", tags=["Пользователи"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user


def _prefs_response(user: User) -> NotificationPreferencesResponse:
    prefs = normalize_preferences(getattr(user, "notification_preferences", None))
    return NotificationPreferencesResponse(
        papers=NotificationChannelPrefs(**prefs["papers"]),
        reviews=NotificationChannelPrefs(**prefs["reviews"]),
        conferences=NotificationChannelPrefs(**prefs["conferences"]),
    )


@router.get("/me/notification-preferences", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(current_user: User = Depends(get_current_user)):
    return _prefs_response(current_user)


@router.patch("/me/notification-preferences", response_model=NotificationPreferencesResponse)
async def update_notification_preferences(
    data: NotificationPreferencesUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patch = data.model_dump(exclude_unset=True)
    merged = merge_preferences_update(
        getattr(current_user, "notification_preferences", None),
        patch,
    )
    current_user.notification_preferences = merged
    await db.commit()
    await db.refresh(current_user)
    return _prefs_response(current_user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/me/password")
async def change_password(
    data: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    current_user.password_hash = get_password_hash(data.new_password)
    await db.commit()
    return {"message": "Пароль обновлён"}


@router.get("/search", response_model=list[UserResponse])
async def search_users(
    q: str = Query(..., min_length=3),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not has_role(current_user, RoleEnum.ORGANIZER, RoleEnum.ADMIN):
        raise HTTPException(status_code=403, detail="Доступ только для организаторов")
    result = await db.execute(
        select(User).where(
            (User.email.ilike(f"%{q}%")) | (User.full_name.ilike(f"%{q}%"))
        ).limit(20)
    )
    return result.scalars().all()
