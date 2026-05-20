from dataclasses import dataclass
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import User
from schemas_email import EmailJob
from services.email_queue import dispatch_email
from services.notification_preferences import should_notify_email, should_notify_in_app
from services.notifications import create_notifications_bulk


@dataclass
class UserNotificationSpec:
    user_id: int
    title: str
    message: str
    link: Optional[str] = None
    email_subject: Optional[str] = None
    email_body: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    user: User | None = None


async def notify_user(
    db: AsyncSession,
    *,
    user_id: int,
    title: str,
    message: str,
    link: Optional[str] = None,
    email_subject: Optional[str] = None,
    email_body: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    user: User | None = None,
) -> None:
    await notify_users(
        db,
        [
            UserNotificationSpec(
                user_id=user_id,
                user=user,
                title=title,
                message=message,
                link=link,
                email_subject=email_subject,
                email_body=email_body,
                entity_type=entity_type,
                entity_id=entity_id,
            )
        ],
    )


async def notify_users(db: AsyncSession, specs: list[UserNotificationSpec]) -> None:
    if not specs:
        return

    users_by_id: dict[int, User] = {spec.user_id: spec.user for spec in specs if spec.user is not None}
    missing_ids = {spec.user_id for spec in specs if spec.user_id not in users_by_id}
    if missing_ids:
        result = await db.execute(select(User).where(User.id.in_(missing_ids)))
        for user in result.scalars().all():
            users_by_id[user.id] = user

    in_app_items: list[tuple[int, str, str, Optional[str], Optional[str], Optional[int]]] = []
    email_jobs: list[EmailJob] = []

    for spec in specs:
        user = users_by_id.get(spec.user_id)
        if not user or user.id != spec.user_id:
            continue

        prefs = getattr(user, "notification_preferences", None) or {}
        if should_notify_in_app(prefs, spec.entity_type):
            in_app_items.append(
                (user.id, spec.title, spec.message, spec.link, spec.entity_type, spec.entity_id)
            )

        if not spec.email_subject or not user.email:
            continue
        if not should_notify_email(prefs, spec.entity_type):
            continue

        body = spec.email_body or spec.message
        email_jobs.append(
            EmailJob(
                template="generic_notification",
                to=user.email,
                subject=spec.email_subject,
                context={
                    "headline": spec.title or spec.email_subject,
                    "body": body,
                    "link": spec.link,
                },
            )
        )

    if in_app_items:
        await create_notifications_bulk(db, in_app_items)

    for job in email_jobs:
        await dispatch_email(job)
