"""Миграция и нормализация theme_json сайта конференции."""
import re
import uuid
from copy import deepcopy
from typing import Any

RESERVED_SLUGS = frozenset({"api", "admin", "login", "register", "static", "uploads"})


def new_id() -> str:
    return uuid.uuid4().hex[:12]


def slugify(title: str, fallback: str = "page") -> str:
    s = title.lower().strip()
    s = re.sub(r"[^a-z0-9а-яё]+", "-", s, flags=re.IGNORECASE)
    s = re.sub(r"-+", "-", s).strip("-")
    if not s or s in RESERVED_SLUGS:
        return fallback
    return s[:64]


def block_from_legacy(b: dict) -> dict:
    return {
        "id": b.get("id") or new_id(),
        "type": b.get("type") or "text",
        "title": b.get("title"),
        "content": b.get("content"),
        "items": b.get("items"),
    }


def migrate_theme_to_pages(theme: dict[str, Any]) -> dict[str, Any]:
    """Если pages пуст — собрать главную из custom_blocks и системных секций."""
    theme = deepcopy(theme or {})
    pages = theme.get("pages") or []
    if pages:
        return theme

    home_id = new_id()
    blocks: list[dict] = []

    if theme.get("show_cfp") and theme.get("cfp_text"):
        blocks.append(
            {
                "id": new_id(),
                "type": "text",
                "title": "Приглашение к участию",
                "content": f"<p>{theme.get('cfp_text', '')}</p>".replace("\n", "</p><p>"),
            }
        )

    if theme.get("show_deadlines"):
        blocks.append({"id": new_id(), "type": "deadlines", "title": "Сроки"})

    if theme.get("show_topics"):
        blocks.append({"id": new_id(), "type": "topics", "title": "Тематики"})

    for b in theme.get("custom_blocks") or []:
        blocks.append(block_from_legacy(b if isinstance(b, dict) else {}))

    if theme.get("show_program"):
        blocks.append({"id": new_id(), "type": "program", "title": "Программа"})

    theme["pages"] = [
        {
            "id": home_id,
            "slug": "",
            "title": "Главная",
            "show_in_nav": True,
            "is_home": True,
            "blocks": blocks,
        }
    ]
    theme["home_page_id"] = home_id
    return theme


def normalize_pages(theme: dict[str, Any]) -> dict[str, Any]:
    theme = migrate_theme_to_pages(theme)
    pages = theme.get("pages") or []
    seen_slugs: set[str] = set()
    home_id = theme.get("home_page_id")

    for i, page in enumerate(pages):
        if not page.get("id"):
            page["id"] = new_id()
        slug = (page.get("slug") or "").strip().lower()
        if page.get("is_home") or slug == "":
            page["slug"] = ""
            page["is_home"] = True
            home_id = page["id"]
        else:
            if not slug:
                slug = slugify(page.get("title") or f"page-{i}", f"page-{i}")
            base = slug
            n = 1
            while slug in seen_slugs or slug in RESERVED_SLUGS:
                slug = f"{base}-{n}"
                n += 1
            page["slug"] = slug
            seen_slugs.add(slug)
        if "show_in_nav" not in page:
            page["show_in_nav"] = True
        for block in page.get("blocks") or []:
            if not block.get("id"):
                block["id"] = new_id()

    theme["home_page_id"] = home_id
    theme["pages"] = pages
    return theme


def find_page_by_slug(theme: dict[str, Any], slug: str | None) -> dict | None:
    theme = migrate_theme_to_pages(theme)
    pages = theme.get("pages") or []
    if not slug:
        for p in pages:
            if p.get("is_home") or p.get("slug") == "":
                return p
        return pages[0] if pages else None
    slug = slug.strip().lower()
    for p in pages:
        if (p.get("slug") or "") == slug:
            return p
    return None
