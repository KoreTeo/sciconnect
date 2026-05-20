import os
import json

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import ConferenceSite
from schemas import (
    SiteSettings,
    SiteResponse,
    PublicConferenceResponse,
)
from dependencies import get_current_user
from rbac import require_organizer_or_admin
from services.cache import cache_delete_pattern, cache_get, cache_set
from services.conference_access import get_managed_conference
from services.rate_limit import require_rate_limit
from services.site_theme import normalize_pages
from services.site_sanitize import sanitize_theme_blocks
from services.site_public import load_public_conference_payload
from services.site_publication import get_or_create_site, load_site, mark_site_published, mark_site_unpublished
from services.storage import save_upload_file, unique_upload_name
from config import settings

router = APIRouter(prefix="/conferences", tags=["Сайты конференций"])

UPLOAD_DIR = settings.UPLOAD_DIR
SITE_UPLOAD_DIR = os.path.join(UPLOAD_DIR, "sites")
MAX_DOCUMENT_BYTES = 25 * 1024 * 1024
MAX_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
ALLOWED_DOCUMENT_EXT = {".pdf", ".zip", ".doc", ".docx"}


@router.get("/{conference_id}/site", response_model=SiteResponse)
async def get_site_settings(conference_id: int, db: AsyncSession = Depends(get_db)):
    site = await load_site(db, conference_id)
    if not site:
        return SiteResponse(
            conference_id=conference_id,
            theme_json=normalize_pages(SiteSettings().model_dump()),
            is_published=False,
        )
    theme = normalize_pages(site.theme_json or {})
    site.theme_json = theme
    return site


@router.post("/{conference_id}/site/assets")
async def upload_site_asset(
    conference_id: int,
    request: Request,
    file: UploadFile = File(...),
    asset_type: str = Form("image"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_organizer_or_admin),
):
    """Загрузка изображений и документов (сборники) для сайта конференции."""
    await require_rate_limit(request, "sites:assets", limit=30, window_seconds=300)
    await get_managed_conference(db, conference_id, current_user)

    if not file.filename:
        raise HTTPException(status_code=400, detail="Файл не указан")

    ext = os.path.splitext(file.filename)[1].lower()
    is_document = asset_type == "document"
    if is_document:
        if ext not in ALLOWED_DOCUMENT_EXT:
            raise HTTPException(
                status_code=400,
                detail="Допустимые форматы документов: PDF, ZIP, DOC, DOCX",
            )
    elif ext not in ALLOWED_IMAGE_EXT:
        raise HTTPException(
            status_code=400,
            detail="Допустимые форматы изображений: JPG, PNG, GIF, WebP, SVG",
        )

    unique_name = unique_upload_name(prefix=f"{conference_id}_{asset_type}", extension=ext)
    size = await save_upload_file(
        file,
        SITE_UPLOAD_DIR,
        unique_name,
        max_bytes=MAX_DOCUMENT_BYTES if is_document else MAX_IMAGE_BYTES,
    )

    url = f"/uploads/sites/{unique_name}"
    return {
        "url": url,
        "file_url": url,
        "file_name": file.filename,
        "size": size,
        "asset_type": asset_type,
    }


@router.put("/{conference_id}/site", response_model=SiteResponse)
async def update_site_settings(
    conference_id: int,
    settings: SiteSettings,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_organizer_or_admin),
):
    await get_managed_conference(db, conference_id, current_user)

    theme_dict = sanitize_theme_blocks(normalize_pages(settings.model_dump()))

    site = await get_or_create_site(db, conference_id)
    site.theme_json = theme_dict

    await db.commit()
    await db.refresh(site)
    await cache_delete_pattern("public:")
    return site


@router.post("/{conference_id}/site/publish", response_model=SiteResponse)
async def publish_site(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_organizer_or_admin),
):
    await get_managed_conference(db, conference_id, current_user)

    site = await get_or_create_site(db, conference_id)
    mark_site_published(site)
    await db.commit()
    await db.refresh(site)
    await cache_delete_pattern("public:")
    return site


@router.post("/{conference_id}/site/unpublish", response_model=SiteResponse)
async def unpublish_site(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_organizer_or_admin),
):
    await get_managed_conference(db, conference_id, current_user)

    site = await load_site(db, conference_id)
    if not site:
        raise HTTPException(status_code=404, detail="Сайт не найден")
    mark_site_unpublished(site)
    await db.commit()
    await db.refresh(site)
    await cache_delete_pattern("public:")
    return site


@router.get("/public/{short_name}", response_model=PublicConferenceResponse)
async def get_public_conference(short_name: str, db: AsyncSession = Depends(get_db)):
    cache_key = f"public:conference:{short_name}"
    cached = await cache_get(cache_key)
    if cached:
        return json.loads(cached)

    response = await load_public_conference_payload(db, short_name)
    await cache_set(cache_key, json.dumps(response.model_dump(mode="json"), default=str), ttl=120)
    return response
