import pytest
from datetime import datetime, timezone

from models import ConferenceRole, ConferenceRoleEnum, ConferenceTrack, Paper, PaperStatusEnum

from conftest import auth_headers, make_paper, user_by_email

pytestmark = pytest.mark.asyncio


async def test_track_chair_sees_only_assigned_track_papers(client, db_session):
    track_chair = await user_by_email(db_session, "other-organizer@test.local")
    author = await user_by_email(db_session, "author@test.local")

    track_a = ConferenceTrack(conference_id=1, name="AI", slug="ai")
    track_b = ConferenceTrack(conference_id=1, name="Systems", slug="systems")
    db_session.add_all([track_a, track_b])
    await db_session.flush()

    db_session.add(
        ConferenceRole(
            conference_id=1,
            user_id=track_chair.id,
            role=ConferenceRoleEnum.TRACK_CHAIR,
            track_id=track_a.id,
        )
    )

    paper_a = make_paper(author.id, title="AI paper")
    paper_a.track_id = track_a.id
    paper_b = make_paper(author.id, title="Systems paper")
    paper_b.track_id = track_b.id
    paper_b.status = PaperStatusEnum.SUBMITTED
    paper_b.submitted_at = datetime.now(timezone.utc)
    db_session.add_all([paper_a, paper_b])
    await db_session.commit()

    headers = await auth_headers(db_session, "other-organizer@test.local")
    response = await client.get("/papers/conference/1", headers=headers)
    assert response.status_code == 200
    titles = {item["title"] for item in response.json()}
    assert titles == {"AI paper"}
