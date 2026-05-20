from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User
from schemas import ProgramSessionCreate, ProgramSessionResponse
from dependencies import get_current_user
from rbac import require_organizer_or_admin
from services.conference_access import get_managed_conference
from services.program_schedule import load_program_sessions, replace_program_sessions

router = APIRouter(prefix="/conferences", tags=["Программа"])


@router.get("/{conference_id}/program", response_model=list[ProgramSessionResponse])
async def get_program(conference_id: int, db: AsyncSession = Depends(get_db)):
    return await load_program_sessions(db, conference_id)


@router.put("/{conference_id}/program", response_model=list[ProgramSessionResponse])
async def update_program(
    conference_id: int,
    sessions: list[ProgramSessionCreate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    await get_managed_conference(db, conference_id, current_user)
    await replace_program_sessions(db, conference_id, sessions)
    await db.commit()
    return await load_program_sessions(db, conference_id)
