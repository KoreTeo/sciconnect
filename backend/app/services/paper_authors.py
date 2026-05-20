from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from models import PaperAuthor
from schemas import PaperAuthorCreate


async def sync_co_authors(db: AsyncSession, paper_id: int, authors: list[PaperAuthorCreate] | None):
    if authors is None:
        return
    await db.execute(delete(PaperAuthor).where(PaperAuthor.paper_id == paper_id))
    for i, a in enumerate(authors):
        if isinstance(a, dict):
            a = PaperAuthorCreate(**a)
        db.add(
            PaperAuthor(
                paper_id=paper_id,
                user_id=a.user_id,
                full_name=a.full_name,
                affiliation=a.affiliation,
                orcid=a.orcid,
                order=a.order if a.order else i,
                is_corresponding=a.is_corresponding,
            )
        )


async def load_co_authors(db: AsyncSession, paper_id: int):
    result = await db.execute(
        select(PaperAuthor).where(PaperAuthor.paper_id == paper_id).order_by(PaperAuthor.order)
    )
    return result.scalars().all()
