from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import ConferenceSite
from schemas import SiteSettings
from services.site_theme import normalize_pages


async def load_site(db: AsyncSession, conference_id: int) -> ConferenceSite | None:
    result = await db.execute(select(ConferenceSite).where(ConferenceSite.conference_id == conference_id))
    return result.scalar_one_or_none()


async def get_or_create_site(db: AsyncSession, conference_id: int) -> ConferenceSite:
    site = await load_site(db, conference_id)
    if site:
        return site
    site = ConferenceSite(
        conference_id=conference_id,
        theme_json=normalize_pages(SiteSettings().model_dump()),
    )
    db.add(site)
    await db.flush()
    return site


def mark_site_published(site: ConferenceSite) -> None:
    site.is_published = True
    site.published_at = datetime.now(timezone.utc)


def mark_site_unpublished(site: ConferenceSite) -> None:
    site.is_published = False
