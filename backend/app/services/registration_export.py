from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import ConferenceRegistration, User

REGISTRATIONS_CSV_HEADERS = [
    "id",
    "user_name",
    "user_email",
    "affiliation",
    "country",
    "orcid",
    "phone",
    "registration_type",
    "status",
    "registered_at",
]


async def build_registrations_csv_rows(db: AsyncSession, conference_id: int) -> list[list]:
    result = await db.execute(
        select(ConferenceRegistration, User)
        .join(User, ConferenceRegistration.user_id == User.id)
        .where(ConferenceRegistration.conference_id == conference_id)
    )
    return [
        [
            reg.id,
            user.full_name,
            user.email,
            user.affiliation or "",
            user.country or "",
            user.orcid or "",
            user.phone or "",
            reg.registration_type.value,
            reg.status.value,
            reg.registered_at.isoformat() if reg.registered_at else "",
        ]
        for reg, user in result.all()
    ]
