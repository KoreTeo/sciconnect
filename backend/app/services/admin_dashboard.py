from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import AdminAuditLog, Conference, ConferenceStatusEnum, RoleEnum, User
from schemas import AdminAuditLogResponse, AdminSummary


def _jsonable(value):
    return getattr(value, "value", value)


def add_audit_change(
    db: AsyncSession,
    *,
    actor_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    before: dict,
    after: dict,
) -> None:
    db.add(
        AdminAuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before={key: _jsonable(value) for key, value in before.items()},
            after={key: _jsonable(value) for key, value in after.items()},
        )
    )


async def build_admin_summary(db: AsyncSession) -> AdminSummary:
    users_total = await db.scalar(select(func.count()).select_from(User))
    users_active = await db.scalar(select(func.count()).select_from(User).where(User.is_active == True))
    users_blocked = await db.scalar(select(func.count()).select_from(User).where(User.is_active == False))
    user_role_rows = await db.execute(select(User.role, func.count()).group_by(User.role))
    conference_total = await db.scalar(select(func.count()).select_from(Conference))
    conference_status_rows = await db.execute(select(Conference.status, func.count()).group_by(Conference.status))

    return AdminSummary(
        users_total=users_total or 0,
        users_active=users_active or 0,
        users_blocked=users_blocked or 0,
        users_by_role={role.value: count for role, count in user_role_rows.all()},
        conferences_total=conference_total or 0,
        conferences_by_status={status.value: count for status, count in conference_status_rows.all()},
    )


async def query_users(
    db: AsyncSession,
    *,
    q: str | None,
    role: RoleEnum | None,
    is_active: bool | None,
    skip: int,
    limit: int,
) -> list[User]:
    query = select(User)
    if q and len(q) >= 2:
        query = query.where(or_(User.email.ilike(f"%{q}%"), User.full_name.ilike(f"%{q}%")))
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    result = await db.execute(query.order_by(User.id).offset(skip).limit(limit))
    return list(result.scalars().all())


async def query_audit_log(
    db: AsyncSession,
    *,
    entity_type: str | None,
    actor_id: int | None,
    skip: int,
    limit: int,
) -> list[AdminAuditLogResponse]:
    query = select(AdminAuditLog).options(selectinload(AdminAuditLog.actor))
    if entity_type:
        query = query.where(AdminAuditLog.entity_type == entity_type)
    if actor_id:
        query = query.where(AdminAuditLog.actor_id == actor_id)
    result = await db.execute(query.order_by(AdminAuditLog.created_at.desc()).offset(skip).limit(limit))
    logs = result.scalars().all()
    return [
        AdminAuditLogResponse(
            id=log.id,
            actor_id=log.actor_id,
            actor_email=log.actor.email if log.actor else None,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            before=log.before or {},
            after=log.after or {},
            created_at=log.created_at,
        )
        for log in logs
    ]


async def query_conferences(
    db: AsyncSession,
    *,
    q: str | None,
    status: ConferenceStatusEnum | None,
    skip: int,
    limit: int,
) -> list[Conference]:
    query = select(Conference)
    if q and len(q) >= 2:
        query = query.where(
            or_(
                Conference.title.ilike(f"%{q}%"),
                Conference.short_name.ilike(f"%{q}%"),
            )
        )
    if status:
        query = query.where(Conference.status == status)
    result = await db.execute(query.order_by(Conference.created_at.desc()).offset(skip).limit(limit))
    return list(result.scalars().all())

