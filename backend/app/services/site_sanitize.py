"""Санитизация HTML контента блоков сайта."""
import bleach

ALLOWED_TAGS = [
    "p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "h4",
    "ul", "ol", "li", "a", "blockquote", "hr", "span",
]
ALLOWED_ATTRS = {"a": ["href", "title", "target", "rel"]}


def sanitize_html(html: str | None) -> str | None:
    if not html:
        return html
    return bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        strip=True,
    )


def sanitize_theme_blocks(theme: dict) -> dict:
    from services.site_theme import normalize_pages

    theme = normalize_pages(theme)
    for page in theme.get("pages") or []:
        for block in page.get("blocks") or []:
            if block.get("type") == "text" and block.get("content"):
                block["content"] = sanitize_html(block["content"])
    return theme
