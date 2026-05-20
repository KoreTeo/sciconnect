from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Conference, Paper, ProceedingsEntry, ProceedingsIssue
from schemas import (
    PaperAuthorResponse,
    ProceedingsEntryResponse,
    ProceedingsExportEntry,
    ProceedingsExportResponse,
    ProceedingsIssueResponse,
)


async def load_issue(db: AsyncSession, conference_id: int) -> ProceedingsIssue | None:
    result = await db.execute(
        select(ProceedingsIssue)
        .where(ProceedingsIssue.conference_id == conference_id)
        .options(
            selectinload(ProceedingsIssue.entries)
            .selectinload(ProceedingsEntry.paper)
            .selectinload(Paper.author),
            selectinload(ProceedingsIssue.entries)
            .selectinload(ProceedingsEntry.paper)
            .selectinload(Paper.co_authors),
        )
    )
    return result.scalar_one_or_none()


async def get_or_create_issue(db: AsyncSession, conference: Conference) -> ProceedingsIssue:
    issue = await load_issue(db, conference.id)
    if issue:
        return issue
    issue = ProceedingsIssue(
        conference_id=conference.id,
        title=f"Сборник трудов: {conference.title}",
        description=conference.description,
    )
    db.add(issue)
    await db.commit()
    return await load_issue(db, conference.id) or issue


def entry_response(entry: ProceedingsEntry) -> ProceedingsEntryResponse:
    paper = entry.paper
    co_authors = []
    if paper and paper.co_authors:
        co_authors = [PaperAuthorResponse.model_validate(author) for author in paper.co_authors]
    return ProceedingsEntryResponse(
        id=entry.id,
        issue_id=entry.issue_id,
        paper_id=entry.paper_id,
        doi=entry.doi,
        pages=entry.pages,
        order=entry.order,
        published_title=entry.published_title,
        published_abstract=entry.published_abstract,
        paper_title=paper.title if paper else None,
        paper_abstract=paper.abstract if paper else None,
        paper_keywords=paper.keywords if paper else [],
        paper_file_url=paper.file_url if paper else None,
        author_name=paper.author.full_name if paper and paper.author else None,
        co_authors=co_authors,
    )


def issue_response(issue: ProceedingsIssue) -> ProceedingsIssueResponse:
    entries = sorted(issue.entries or [], key=lambda item: (item.order, item.id))
    return ProceedingsIssueResponse(
        id=issue.id,
        conference_id=issue.conference_id,
        title=issue.title,
        description=issue.description,
        isbn=issue.isbn,
        doi_prefix=issue.doi_prefix,
        is_published=issue.is_published,
        published_at=issue.published_at,
        created_at=issue.created_at,
        entries=[entry_response(entry) for entry in entries],
    )


def export_response(issue: ProceedingsIssue) -> ProceedingsExportResponse:
    items = []
    for entry in sorted(issue.entries or [], key=lambda item: (item.order, item.id)):
        if not entry.paper:
            continue
        authors = [entry.paper.author.full_name] if entry.paper.author else []
        authors.extend(author.full_name for author in entry.paper.co_authors or [])
        author_orcid = entry.paper.author.orcid if entry.paper.author else None
        items.append(
            ProceedingsExportEntry(
                paper_id=entry.paper_id,
                title=entry.published_title or entry.paper.title,
                abstract=entry.published_abstract or entry.paper.abstract,
                keywords=entry.paper.keywords or [],
                authors=authors,
                author_orcid=author_orcid,
                doi=entry.doi,
                pages=entry.pages,
            )
        )
    return ProceedingsExportResponse(
        conference_id=issue.conference_id,
        issue_title=issue.title,
        isbn=issue.isbn,
        doi_prefix=issue.doi_prefix,
        entries=items,
    )
