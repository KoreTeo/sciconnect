from collections.abc import Sequence

from fastapi import HTTPException
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.interfaces import ORMOption

from models import Review


async def get_review_or_404(
    db: AsyncSession,
    review_id: int,
    *,
    detail: str = "Рецензия не найдена",
    options: Sequence[ORMOption] | None = None,
) -> Review:
    query = select(Review).where(Review.id == review_id)
    if options:
        query = query.options(*options)
    result = await db.execute(query)
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail=detail)
    return review


async def list_reviews(db: AsyncSession, query: Select[tuple[Review]]) -> list[Review]:
    result = await db.execute(query)
    return list(result.scalars().all())

