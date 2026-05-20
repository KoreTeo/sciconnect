import pytest
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from models import Paper, PaperAuthor, PaperStatusEnum
from services.paper_export import PAPERS_CSV_HEADERS, build_papers_csv_rows

from conftest import make_paper, user_by_email

pytestmark = pytest.mark.asyncio


async def test_build_papers_csv_rows_includes_authors_and_keywords(db_session):
    author = await user_by_email(db_session, "author@test.local")
    paper = make_paper(author.id, title="Export Paper")
    paper.keywords = ["ml", "nlp"]
    paper.status = PaperStatusEnum.SUBMITTED
    db_session.add(paper)
    await db_session.flush()
    db_session.add(
        PaperAuthor(
            paper_id=paper.id,
            full_name="Co Author",
            orcid="0000-0002-1825-0097",
        )
    )
    await db_session.commit()

    rows = await build_papers_csv_rows(db_session, conference_id=1)

    assert len(rows) == 1
    row = rows[0]
    assert len(row) == len(PAPERS_CSV_HEADERS)
    assert row[PAPERS_CSV_HEADERS.index("title")] == "Export Paper"
    assert row[PAPERS_CSV_HEADERS.index("keywords")] == "ml, nlp"
    assert "Co Author" in row[PAPERS_CSV_HEADERS.index("co_authors")]
    assert "0000-0002-1825-0097" in row[PAPERS_CSV_HEADERS.index("co_authors")]

    papers_result = await db_session.execute(
        select(Paper)
        .where(Paper.conference_id == 1)
        .options(selectinload(Paper.co_authors))
    )
    assert papers_result.scalars().first() is not None
