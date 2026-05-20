import json
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models import (
    Conference,
    Paper,
    PaperStatusEnum,
    ProceedingsEntry,
    ProceedingsIssue,
    User,
)
from rbac import require_organizer_or_admin
from schemas import (
    ProceedingsAddEntry,
    ProceedingsEntryUpdate,
    ProceedingsIssueResponse,
    ProceedingsIssueUpdate,
)
from services.cache import cache_delete_pattern, cache_get, cache_set
from services.csv_export import csv_text_response
from services.conference_access import get_managed_conference
from services.proceedings_manage import (
    add_entry,
    get_issue_entry_or_404,
    mark_issue_published,
    require_issue_has_entries,
)
from services.proceedings import export_response, get_or_create_issue, issue_response, load_issue

router = APIRouter(prefix="/conferences", tags=["Сборники"])


@router.get("/{conference_id}/proceedings", response_model=ProceedingsIssueResponse)
async def get_conference_proceedings(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    conference = await get_managed_conference(db, conference_id, current_user)
    issue = await get_or_create_issue(db, conference)
    return issue_response(issue)


@router.patch("/{conference_id}/proceedings", response_model=ProceedingsIssueResponse)
async def update_conference_proceedings(
    conference_id: int,
    data: ProceedingsIssueUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    conference = await get_managed_conference(db, conference_id, current_user)
    issue = await get_or_create_issue(db, conference)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(issue, field, value)
    await db.commit()
    await cache_delete_pattern("public:")
    issue = await load_issue(db, conference_id)
    return issue_response(issue)


@router.post("/{conference_id}/proceedings/entries", response_model=ProceedingsIssueResponse)
async def add_proceedings_entry(
    conference_id: int,
    data: ProceedingsAddEntry,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    conference = await get_managed_conference(db, conference_id, current_user)
    issue = await get_or_create_issue(db, conference)
    await add_entry(db, issue=issue, conference_id=conference_id, paper_id=data.paper_id)
    await db.commit()
    await cache_delete_pattern("public:")
    issue = await load_issue(db, conference_id)
    return issue_response(issue)


@router.patch("/{conference_id}/proceedings/entries/{entry_id}", response_model=ProceedingsIssueResponse)
async def update_proceedings_entry(
    conference_id: int,
    entry_id: int,
    data: ProceedingsEntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    conference = await get_managed_conference(db, conference_id, current_user)
    issue = await get_or_create_issue(db, conference)
    entry = await get_issue_entry_or_404(db, issue_id=issue.id, entry_id=entry_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    await db.commit()
    await cache_delete_pattern("public:")
    issue = await load_issue(db, conference_id)
    return issue_response(issue)


@router.delete("/{conference_id}/proceedings/entries/{entry_id}", response_model=ProceedingsIssueResponse)
async def remove_proceedings_entry(
    conference_id: int,
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    conference = await get_managed_conference(db, conference_id, current_user)
    issue = await get_or_create_issue(db, conference)
    entry = await get_issue_entry_or_404(db, issue_id=issue.id, entry_id=entry_id)
    await db.delete(entry)
    await db.commit()
    await cache_delete_pattern("public:")
    issue = await load_issue(db, conference_id)
    return issue_response(issue)


@router.post("/{conference_id}/proceedings/publish", response_model=ProceedingsIssueResponse)
async def publish_proceedings(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    conference = await get_managed_conference(db, conference_id, current_user)
    issue = await get_or_create_issue(db, conference)
    require_issue_has_entries(issue)
    mark_issue_published(issue)
    await db.commit()
    await cache_delete_pattern("public:")
    issue = await load_issue(db, conference_id)
    return issue_response(issue)


@router.post("/{conference_id}/proceedings/unpublish", response_model=ProceedingsIssueResponse)
async def unpublish_proceedings(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    conference = await get_managed_conference(db, conference_id, current_user)
    issue = await get_or_create_issue(db, conference)
    issue.is_published = False
    await db.commit()
    await cache_delete_pattern("public:")
    issue = await load_issue(db, conference_id)
    return issue_response(issue)


@router.get("/{conference_id}/proceedings/export")
async def export_proceedings(
    conference_id: int,
    format: Literal["json", "csv"] = "json",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conference = await get_managed_conference(db, conference_id, current_user)
    issue = await get_or_create_issue(db, conference)
    export = export_response(issue)
    if format == "json":
        return export

    headers = ["paper_id", "title", "authors", "author_orcid", "doi", "pages", "keywords", "abstract"]
    rows = [
        [
            item.paper_id,
            item.title,
            "; ".join(item.authors),
            item.author_orcid or "",
            item.doi or "",
            item.pages or "",
            "; ".join(item.keywords),
            item.abstract,
        ]
        for item in export.entries
    ]
    return csv_text_response(headers, rows)


@router.get("/public/{short_name}/proceedings", response_model=ProceedingsIssueResponse)
async def get_public_proceedings(short_name: str, db: AsyncSession = Depends(get_db)):
    cache_key = f"public:proceedings:{short_name}"
    cached = await cache_get(cache_key)
    if cached:
        return json.loads(cached)

    conf_result = await db.execute(select(Conference).where(Conference.short_name == short_name))
    conference = conf_result.scalar_one_or_none()
    if not conference:
        raise HTTPException(status_code=404, detail="Конференция не найдена")
    issue = await load_issue(db, conference.id)
    if not issue or not issue.is_published:
        raise HTTPException(status_code=404, detail="Сборник не опубликован")
    response = issue_response(issue)
    await cache_set(cache_key, json.dumps(response.model_dump(mode="json"), default=str), ttl=120)
    return response
