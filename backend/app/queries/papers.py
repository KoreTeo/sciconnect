from fastapi import HTTPException
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Paper


async def get_paper_or_404(db: AsyncSession, paper_id: int, *, detail: str = "Статья не найдена") -> Paper:
    result = await db.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail=detail)
    return paper


async def list_papers(db: AsyncSession, query: Select[tuple[Paper]]) -> list[Paper]:
    result = await db.execute(query)
    return list(result.scalars().all())

