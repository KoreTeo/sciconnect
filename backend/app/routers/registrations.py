from fastapi import APIRouter, Depends, HTTPException, Query
from services.csv_export import csv_streaming_response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import (
    Conference,
    ConferenceRegistration,
    RegistrationTypeEnum,
    RegistrationStatusEnum,
    User,
)
from schemas import RegistrationCreate, RegistrationResponse
from dependencies import get_current_user, require_verified_email
from rbac import require_organizer_or_admin
from constants import (
    REGISTRATION_INVALID_TYPE_CODE,
    REGISTRATION_INVALID_TYPE_DETAIL,
    REGISTRATION_PROFILE_AFFILIATION_REQUIRED_CODE,
    REGISTRATION_PROFILE_AFFILIATION_REQUIRED_DETAIL,
    REGISTRATION_TERMS_REQUIRED_CODE,
    REGISTRATION_TERMS_REQUIRED_DETAIL,
)
from errors import coded_http_exception
from services.conference_access import get_managed_conference
from services.registration_export import REGISTRATIONS_CSV_HEADERS, build_registrations_csv_rows
from services.payment_pricing import fee_required_for_purpose

router = APIRouter(prefix="/conferences", tags=["Регистрация на конференцию"])


def _registration_response(reg: ConferenceRegistration, conf: Conference, user: User | None = None) -> RegistrationResponse:
    return RegistrationResponse(
        id=reg.id,
        conference_id=reg.conference_id,
        user_id=reg.user_id,
        registration_type=reg.registration_type.value,
        status=reg.status.value,
        registered_at=reg.registered_at,
        user_name=user.full_name if user else None,
        user_email=user.email if user else None,
        user_country=user.country if user else None,
        conference_title=conf.title,
        short_name=conf.short_name,
    )


@router.get("/my/registrations", response_model=list[RegistrationResponse])
async def my_registrations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ConferenceRegistration, Conference)
        .join(Conference, ConferenceRegistration.conference_id == Conference.id)
        .where(ConferenceRegistration.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    return [
        _registration_response(reg, conf, current_user)
        for reg, conf in result.all()
    ]


@router.post("/{conference_id}/register", response_model=RegistrationResponse)
async def register_for_conference(
    conference_id: int,
    data: RegistrationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_verified_email),
):
    result = await db.execute(select(Conference).where(Conference.id == conference_id))
    conf = result.scalar_one_or_none()
    if not conf:
        raise HTTPException(status_code=404, detail="Конференция не найдена")

    if conf.organizer_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Организатор не может регистрироваться на свою конференцию",
        )

    existing = await db.execute(
        select(ConferenceRegistration).where(
            ConferenceRegistration.conference_id == conference_id,
            ConferenceRegistration.user_id == current_user.id,
        )
    )
    existing_reg = existing.scalar_one_or_none()
    if existing_reg:
        if existing_reg.status == RegistrationStatusEnum.CONFIRMED:
            raise HTTPException(status_code=400, detail="Вы уже зарегистрированы")
        return _registration_response(existing_reg, conf, current_user)

    if not data.accept_terms:
        raise coded_http_exception(
            status_code=400,
            code=REGISTRATION_TERMS_REQUIRED_CODE,
            message=REGISTRATION_TERMS_REQUIRED_DETAIL,
        )

    if data.registration_type not in ("listener", "author"):
        raise coded_http_exception(
            status_code=400,
            code=REGISTRATION_INVALID_TYPE_CODE,
            message=REGISTRATION_INVALID_TYPE_DETAIL,
        )

    if not (current_user.affiliation or "").strip():
        raise coded_http_exception(
            status_code=400,
            code=REGISTRATION_PROFILE_AFFILIATION_REQUIRED_CODE,
            message=REGISTRATION_PROFILE_AFFILIATION_REQUIRED_DETAIL,
        )

    reg_type = RegistrationTypeEnum.LISTENER
    if data.registration_type == "author":
        reg_type = RegistrationTypeEnum.AUTHOR

    needs_payment = fee_required_for_purpose(conf, "registration")
    reg_status = RegistrationStatusEnum.PENDING if needs_payment else RegistrationStatusEnum.CONFIRMED

    reg = ConferenceRegistration(
        conference_id=conference_id,
        user_id=current_user.id,
        registration_type=reg_type,
        status=reg_status,
    )
    db.add(reg)
    await db.commit()
    await db.refresh(reg)
    return _registration_response(reg, conf, current_user)


@router.get("/{conference_id}/registrations", response_model=list[RegistrationResponse])
async def list_registrations(
    conference_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    conference = await get_managed_conference(db, conference_id, current_user)

    result = await db.execute(
        select(ConferenceRegistration, User)
        .join(User, ConferenceRegistration.user_id == User.id)
        .where(ConferenceRegistration.conference_id == conference_id)
        .offset(skip)
        .limit(limit)
    )
    return [
        _registration_response(reg, conference, u)
        for reg, u in result.all()
    ]


@router.get("/{conference_id}/registrations/export")
async def export_registrations_csv(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    await get_managed_conference(db, conference_id, current_user)
    rows = await build_registrations_csv_rows(db, conference_id)
    return csv_streaming_response(REGISTRATIONS_CSV_HEADERS, rows, f"registrations_{conference_id}.csv")
