from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Paper, PaperStatusEnum, ProceedingsEntry, ProceedingsIssue


async def add_entry(db: AsyncSession, *, issue: ProceedingsIssue, conference_id: int, paper_id: int) -> None:
    paper_result = await db.execute(
        select(Paper)
        .where(Paper.id == paper_id, Paper.conference_id == conference_id)
        .options(selectinload(Paper.author), selectinload(Paper.co_authors))
    )
    paper = paper_result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Статья не найдена")
    if paper.status != PaperStatusEnum.ACCEPTED:
        raise HTTPException(status_code=400, detail="В сборник можно добавить только принятую статью")

    existing_result = await db.execute(
        select(ProceedingsEntry).where(
            ProceedingsEntry.issue_id == issue.id,
            ProceedingsEntry.paper_id == paper.id,
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Статья уже добавлена в сборник")

    order_result = await db.execute(
        select(func.coalesce(func.max(ProceedingsEntry.order), 0)).where(ProceedingsEntry.issue_id == issue.id)
    )
    next_order = (order_result.scalar_one() or 0) + 1
    db.add(
        ProceedingsEntry(
            issue_id=issue.id,
            paper_id=paper.id,
            order=next_order,
            published_title=paper.title,
            published_abstract=paper.abstract,
        )
    )


async def get_issue_entry_or_404(db: AsyncSession, *, issue_id: int, entry_id: int) -> ProceedingsEntry:
    entry_result = await db.execute(
        select(ProceedingsEntry).where(ProceedingsEntry.id == entry_id, ProceedingsEntry.issue_id == issue_id)
    )
    entry = entry_result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Запись сборника не найдена")
    return entry


def require_issue_has_entries(issue: ProceedingsIssue) -> None:
    if issue.entries:
        return
    raise HTTPException(status_code=400, detail="Добавьте хотя бы одну статью перед публикацией")


def mark_issue_published(issue: ProceedingsIssue) -> None:
    issue.is_published = True
    issue.published_at = datetime.now(timezone.utc)

