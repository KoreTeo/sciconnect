from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from models import Conference, User
from queries.conferences import get_conference_or_404
from services.conference_roles import user_manages_conference, user_track_chair_track_ids


async def _load_conference(db: AsyncSession, conference_id: int) -> Conference:
    return await get_conference_or_404(db, conference_id)


async def ensure_conference_managed(
    db: AsyncSession,
    conference: Conference,
    user: User,
    *,
    detail: str = "Доступ только для организатора",
) -> Conference:
    if not await user_manages_conference(db, conference, user):
        raise HTTPException(status_code=403, detail=detail)
    return conference


async def get_managed_conference(
    db: AsyncSession,
    conference_id: int,
    user: User,
    *,
    detail: str = "Доступ только для организатора",
) -> Conference:
    conference = await _load_conference(db, conference_id)
    return await ensure_conference_managed(db, conference, user, detail=detail)


async def get_conference_paper_access(
    db: AsyncSession,
    conference_id: int,
    user: User,
    *,
    detail: str = "Доступ только для организатора",
) -> tuple[Conference, list[int] | None]:
    conference = await _load_conference(db, conference_id)
    if await user_manages_conference(db, conference, user):
        return conference, None
    track_ids = await user_track_chair_track_ids(db, conference_id, user.id)
    if track_ids:
        return conference, track_ids
    raise HTTPException(status_code=403, detail=detail)
