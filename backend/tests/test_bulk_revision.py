import pytest
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from models import Paper, PaperStatusEnum
from schemas import BulkPaperRevisionRequestCreate
from services.paper_workflow import bulk_request_paper_revision

from conftest import make_paper, user_by_email

pytestmark = pytest.mark.asyncio


async def test_bulk_request_revision_updates_eligible_papers(db_session):
    author = await user_by_email(db_session, "author@test.local")
    organizer = await user_by_email(db_session, "organizer@test.local")
    paper_a = make_paper(author.id, title="Bulk A")
    paper_b = make_paper(author.id, title="Bulk B")
    paper_a.status = PaperStatusEnum.UNDER_REVIEW
    paper_b.status = PaperStatusEnum.SUBMITTED
    db_session.add_all([paper_a, paper_b])
    await db_session.flush()

    updated, skipped = await bulk_request_paper_revision(
        db_session,
        paper_a.conference_id,
        [paper_a.id, paper_b.id],
        "Please improve both papers",
        organizer,
    )
    await db_session.commit()

    assert len(updated) == 2
    assert skipped == []
    result = await db_session.execute(select(Paper).where(Paper.id.in_([paper_a.id, paper_b.id])))
    statuses = {paper.id: paper.status for paper in result.scalars().all()}
    assert statuses[paper_a.id] == PaperStatusEnum.REVISION_REQUIRED
    assert statuses[paper_b.id] == PaperStatusEnum.REVISION_REQUIRED


async def test_bulk_request_revision_skips_invalid_status(db_session):
    author = await user_by_email(db_session, "author@test.local")
    organizer = await user_by_email(db_session, "organizer@test.local")
    paper = make_paper(author.id, title="Accepted paper")
    paper.status = PaperStatusEnum.ACCEPTED
    db_session.add(paper)
    await db_session.flush()

    updated, skipped = await bulk_request_paper_revision(
        db_session,
        paper.conference_id,
        [paper.id],
        "Cannot revise accepted",
        organizer,
    )

    assert updated == []
    assert len(skipped) == 1
    assert skipped[0][0] == paper.id


async def test_bulk_request_revision_skips_foreign_paper(db_session):
    author = await user_by_email(db_session, "author@test.local")
    organizer = await user_by_email(db_session, "organizer@test.local")
    paper = make_paper(author.id, title="Foreign")
    paper.status = PaperStatusEnum.SUBMITTED
    db_session.add(paper)
    await db_session.flush()

    updated, skipped = await bulk_request_paper_revision(
        db_session,
        99999,
        [paper.id],
        "Wrong conference",
        organizer,
    )

    assert updated == []
    assert skipped == [(paper.id, "Статья не найдена в конференции")]
