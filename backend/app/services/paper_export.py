from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Paper

PAPERS_CSV_HEADERS = [
    "id",
    "title",
    "status",
    "author_id",
    "author_name",
    "author_email",
    "author_orcid",
    "abstract",
    "keywords",
    "co_authors",
    "submitted_at",
]


async def build_papers_csv_rows(db: AsyncSession, conference_id: int) -> list[list]:
    papers_result = await db.execute(
        select(Paper)
        .where(Paper.conference_id == conference_id)
        .options(selectinload(Paper.author), selectinload(Paper.co_authors))
    )
    papers = papers_result.scalars().all()

    rows = []
    for paper in papers:
        co_authors = "; ".join(
            f"{author.full_name}" + (f" ({author.orcid})" if getattr(author, "orcid", None) else "")
            for author in (paper.co_authors or [])
        )
        keywords = (
            ", ".join(paper.keywords or [])
            if isinstance(paper.keywords, list)
            else str(paper.keywords or "")
        )
        rows.append([
            paper.id,
            paper.title,
            paper.status.value if hasattr(paper.status, "value") else paper.status,
            paper.author_id,
            paper.author.full_name if paper.author else "",
            paper.author.email if paper.author else "",
            paper.author.orcid if paper.author else "",
            paper.abstract or "",
            keywords,
            co_authors,
            paper.submitted_at.isoformat() if paper.submitted_at else "",
        ])
    return rows
