from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Conference, ConferenceRole, ConferenceRoleEnum, User


async def user_manages_conference(db: AsyncSession, conference: Conference, user: User) -> bool:
    if conference.organizer_id == user.id:
        return True
    role = getattr(user.role, "value", user.role)
    if role == "admin":
        return True
    result = await db.execute(
        select(ConferenceRole.id).where(
            ConferenceRole.conference_id == conference.id,
            ConferenceRole.user_id == user.id,
            ConferenceRole.role == ConferenceRoleEnum.CO_ORGANIZER.value,
        ).limit(1)
    )
    return result.scalar_one_or_none() is not None


async def user_track_chair_track_ids(db: AsyncSession, conference_id: int, user_id: int) -> list[int]:
    result = await db.execute(
        select(ConferenceRole.track_id).where(
            ConferenceRole.conference_id == conference_id,
            ConferenceRole.user_id == user_id,
            ConferenceRole.role == ConferenceRoleEnum.TRACK_CHAIR.value,
            ConferenceRole.track_id.is_not(None),
        )
    )
    return [row[0] for row in result.all() if row[0] is not None]
