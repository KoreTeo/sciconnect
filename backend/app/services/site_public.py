from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Conference, Paper, ProceedingsEntry, ProceedingsIssue, ProgramSession
from schemas import (
    ConferenceResponse,
    PaperAuthorResponse,
    ProceedingsEntryResponse,
    ProceedingsIssueResponse,
    ProgramSessionResponse,
    PublicConferenceResponse,
    SiteResponse,
)
from services.site_theme import normalize_pages


async def load_public_conference_payload(db: AsyncSession, short_name: str) -> PublicConferenceResponse:
    result = await db.execute(
        select(Conference)
        .where(Conference.short_name == short_name)
        .options(selectinload(Conference.site))
    )
    conf = result.scalar_one_or_none()
    if not conf:
        raise HTTPException(status_code=404, detail="Конференция не найдена")
    if not conf.site or not conf.site.is_published:
        raise HTTPException(status_code=404, detail="Сайт не опубликован")

    prog_result = await db.execute(
        select(ProgramSession)
        .where(ProgramSession.conference_id == conf.id)
        .options(selectinload(ProgramSession.items))
    )
    sessions = prog_result.scalars().all()
    proceedings_result = await db.execute(
        select(ProceedingsIssue)
        .where(ProceedingsIssue.conference_id == conf.id, ProceedingsIssue.is_published == True)
        .options(
            selectinload(ProceedingsIssue.entries).selectinload(ProceedingsEntry.paper).selectinload(Paper.author),
            selectinload(ProceedingsIssue.entries).selectinload(ProceedingsEntry.paper).selectinload(Paper.co_authors),
        )
    )
    proceedings = proceedings_result.scalar_one_or_none()

    base = ConferenceResponse.model_validate(conf)
    site_data = SiteResponse.model_validate(conf.site)
    site_data.theme_json = normalize_pages(conf.site.theme_json or {})
    proceedings_data = None
    if proceedings:
        entries = []
        for entry in sorted(proceedings.entries or [], key=lambda item: (item.order, item.id)):
            paper = entry.paper
            entries.append(
                ProceedingsEntryResponse(
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
                    co_authors=[PaperAuthorResponse.model_validate(author) for author in (paper.co_authors if paper else [])],
                )
            )
        proceedings_data = ProceedingsIssueResponse(
            id=proceedings.id,
            conference_id=proceedings.conference_id,
            title=proceedings.title,
            description=proceedings.description,
            isbn=proceedings.isbn,
            doi_prefix=proceedings.doi_prefix,
            is_published=proceedings.is_published,
            published_at=proceedings.published_at,
            created_at=proceedings.created_at,
            entries=entries,
        )
    return PublicConferenceResponse(
        **base.model_dump(),
        site=site_data,
        program=[ProgramSessionResponse.model_validate(s) for s in sessions],
        proceedings=proceedings_data,
    )

