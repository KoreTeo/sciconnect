from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from config import settings


def build_frontend_url(path: str = "") -> str:
    base = settings.FRONTEND_URL.rstrip("/")
    if not path:
        return base
    return f"{base}/{path.lstrip('/')}"

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "email_templates"

_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(["html", "xml"]),
)


def _base_context(extra: dict | None = None) -> dict:
    ctx = {
        "app_name": settings.APP_NAME,
        "frontend_url": settings.FRONTEND_URL.rstrip("/"),
        "year": datetime.now().year,
    }
    if extra:
        ctx.update(extra)
    if ctx.get("link") and not ctx.get("cta_url"):
        ctx["cta_url"] = build_frontend_url(ctx["link"])
    if ctx.get("cta_url") and not ctx.get("cta_label"):
        ctx["cta_label"] = "Открыть в SciConnect"
    return ctx


def render_email(template: str, context: dict | None = None) -> tuple[str, str]:
    ctx = _base_context(context)
    html_name = template if template.endswith(".html") else f"{template}.html"
    plain_name = "plain_wrapper.txt.j2"
    html = _env.get_template(html_name).render(**ctx)
    plain = _env.get_template(plain_name).render(**ctx)
    return html, plain
