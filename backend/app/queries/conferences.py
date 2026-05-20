from fastapi import HTTPException
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Conference


async def get_conference_or_404(db: AsyncSession, conference_id: int) -> Conference:
    result = await db.execute(select(Conference).where(Conference.id == conference_id))
    conference = result.scalar_one_or_none()
    if not conference:
        raise HTTPException(status_code=404, detail="Конференция не найдена")
    return conference


async def get_conference_by_short_name_or_404(db: AsyncSession, short_name: str) -> Conference:
    result = await db.execute(select(Conference).where(Conference.short_name == short_name))
    conference = result.scalar_one_or_none()
    if not conference:
        raise HTTPException(status_code=404, detail="Конференция не найдена")
    return conference


async def conference_short_name_exists(db: AsyncSession, short_name: str) -> bool:
    result = await db.execute(select(Conference.id).where(Conference.short_name == short_name).limit(1))
    return result.scalar_one_or_none() is not None


async def list_conferences(db: AsyncSession, query: Select[tuple[Conference]]) -> list[Conference]:
    result = await db.execute(query)
    return list(result.scalars().all())

