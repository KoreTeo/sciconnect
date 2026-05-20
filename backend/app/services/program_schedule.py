from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import ProgramItem, ProgramSession
from schemas import ProgramSessionCreate


async def load_program_sessions(db: AsyncSession, conference_id: int) -> list[ProgramSession]:
    result = await db.execute(
        select(ProgramSession)
        .where(ProgramSession.conference_id == conference_id)
        .options(selectinload(ProgramSession.items))
        .order_by(ProgramSession.start_time)
    )
    sessions = list(result.scalars().all())
    for session in sessions:
        session.items.sort(key=lambda item: item.order)
    return sessions


async def replace_program_sessions(db: AsyncSession, conference_id: int, sessions: list[ProgramSessionCreate]) -> None:
    old = await db.execute(
        select(ProgramSession)
        .where(ProgramSession.conference_id == conference_id)
        .options(selectinload(ProgramSession.items))
    )
    for session in old.scalars().all():
        for item in session.items:
            await db.delete(item)
        await db.delete(session)

    for sess_data in sessions:
        session = ProgramSession(
            conference_id=conference_id,
            title=sess_data.title,
            description=sess_data.description,
            start_time=sess_data.start_time,
            end_time=sess_data.end_time,
            room=sess_data.room,
        )
        db.add(session)
        await db.flush()
        for item_data in sess_data.items:
            db.add(
                ProgramItem(
                    session_id=session.id,
                    paper_id=item_data.paper_id,
                    title=item_data.title,
                    authors=item_data.authors,
                    start_time=item_data.start_time,
                    end_time=item_data.end_time,
                    order=item_data.order,
                )
            )

