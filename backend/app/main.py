import asyncio
import os
import logging
from contextlib import asynccontextmanager

from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings
from database import engine, Base
from logging_config import configure_logging
from routers import (
    auth,
    users,
    conferences,
    papers,
    reviews,
    program,
    sites,
    notifications,
    admin,
    dashboard,
    registrations,
    payments,
    proceedings,
)

UPLOAD_DIR = settings.UPLOAD_DIR
SITE_UPLOAD_DIR = os.path.join(UPLOAD_DIR, "sites")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SITE_UPLOAD_DIR, exist_ok=True)

configure_logging()
logger = logging.getLogger(__name__)


async def init_db():
    """Create tables for SQLite test/dev only. Postgres schema is managed by Alembic."""
    url = str(settings.DATABASE_URL)
    if "sqlite" not in url:
        return
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def _run_seed_demo_background() -> None:
    try:
        from seed_demo import seed_demo as run_seed_demo

        await run_seed_demo()
    except Exception as e:
        logger.exception("Не удалось загрузить демо-данные (seed): %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    seed_demo = os.getenv("SEED_DEMO", "1" if settings.SEED_DEMO else "0") == "1"
    if seed_demo:
        asyncio.create_task(_run_seed_demo_background())
    yield


def _cors_origins() -> list[str]:
    return [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
    redirect_slashes=False,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(conferences.router)
app.include_router(papers.router)
app.include_router(reviews.router)
app.include_router(program.router)
app.include_router(sites.router)
app.include_router(notifications.router)
app.include_router(admin.router)
app.include_router(dashboard.router)
app.include_router(registrations.router)
app.include_router(payments.router)
app.include_router(proceedings.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled API error on %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Внутренняя ошибка сервера"})


@app.get("/")
async def root():
    return {"message": "SciConnect API работает"}


@app.get("/health")
async def health():
    return {"status": "ok"}
