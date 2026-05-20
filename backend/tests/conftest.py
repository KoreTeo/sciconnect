import os
import sys

os.environ.setdefault("EMAIL_ASYNC", "false")
os.environ.setdefault("EMAIL_VERIFICATION_REQUIRED", "false")
from datetime import date, datetime, timezone
from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
APP_DIR = os.path.join(ROOT, "app")
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

from auth import create_access_token, get_password_hash  # noqa: E402
from database import Base, get_db  # noqa: E402
from main import app  # noqa: E402
from models import Conference, ConferenceStatusEnum, FormatEnum, Paper, PaperRevisionRequest, PaperStatusEnum, PaperVersion, RoleEnum, User  # noqa: E402


@pytest_asyncio.fixture()
async def db_session() -> AsyncIterator[AsyncSession]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with SessionLocal() as session:
        users = [
            User(email="admin@test.local", password_hash=get_password_hash("password"), full_name="Admin", affiliation="Org", role=RoleEnum.ADMIN),
            User(email="organizer@test.local", password_hash=get_password_hash("password"), full_name="Organizer", affiliation="Org", role=RoleEnum.ORGANIZER),
            User(email="other-organizer@test.local", password_hash=get_password_hash("password"), full_name="Other Organizer", affiliation="Org", role=RoleEnum.ORGANIZER),
            User(email="author@test.local", password_hash=get_password_hash("password"), full_name="Author", affiliation="Org", role=RoleEnum.USER),
            User(email="blocked@test.local", password_hash=get_password_hash("password"), full_name="Blocked", affiliation="Org", role=RoleEnum.USER, is_active=False),
        ]
        session.add_all(users)
        await session.flush()
        session.add(
            Conference(
                organizer_id=users[1].id,
                title="Managed Conference",
                short_name="managed",
                description="Conference for permission tests",
                topics=["security"],
                start_date=date(2026, 6, 1),
                end_date=date(2026, 6, 2),
                submission_deadline=datetime(2026, 5, 25, tzinfo=timezone.utc),
                review_deadline=datetime(2026, 5, 28, tzinfo=timezone.utc),
                location="Online",
                format=FormatEnum.ONLINE,
                status=ConferenceStatusEnum.SUBMISSION_OPEN,
            )
        )
        await session.commit()
        yield session
    await engine.dispose()


@pytest_asyncio.fixture()
async def query_counter(db_session):
    counter = {"count": 0}
    bind = db_session.get_bind()
    sync_engine = bind.sync_engine if hasattr(bind, "sync_engine") else bind

    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        stmt = statement.lstrip().upper()
        if not stmt.startswith(("SELECT", "WITH")):
            return
        if stmt.startswith(("PRAGMA",)):
            return
        counter["count"] += 1

    event.listen(sync_engine, "before_cursor_execute", before_cursor_execute)
    yield counter
    event.remove(sync_engine, "before_cursor_execute", before_cursor_execute)


@pytest_asyncio.fixture()
async def client(db_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as test_client:
        yield test_client
    app.dependency_overrides.clear()


def token_for(user_id: int, role: RoleEnum) -> str:
    return create_access_token({"sub": str(user_id), "role": role.value})


async def auth_headers(db_session: AsyncSession, email: str) -> dict[str, str]:
    user = await user_by_email(db_session, email)
    return {"Authorization": f"Bearer {token_for(user.id, user.role)}"}


async def user_by_email(db_session: AsyncSession, email: str) -> User:
    from sqlalchemy import select

    result = await db_session.execute(select(User).where(User.email == email))
    user = result.scalar_one()
    return user


def make_paper(author_id: int, *, conference_id: int = 1, title: str = "Test Paper") -> Paper:
    return Paper(
        conference_id=conference_id,
        author_id=author_id,
        title=title,
        abstract="Long enough abstract for backend contract testing.",
        keywords=["test"],
        status=PaperStatusEnum.SUBMITTED,
        submitted_at=datetime.now(timezone.utc),
    )


def make_paper_version(paper: Paper, user_id: int, version_number: int = 1) -> PaperVersion:
    return PaperVersion(
        paper_id=paper.id,
        version_number=version_number,
        title=paper.title,
        abstract=paper.abstract,
        keywords=paper.keywords,
        created_by=user_id,
    )


def make_revision_request(paper: Paper, requester_id: int, round_number: int, comment: str) -> PaperRevisionRequest:
    return PaperRevisionRequest(
        paper_id=paper.id,
        requested_by=requester_id,
        comment=comment,
        round_number=round_number,
    )
