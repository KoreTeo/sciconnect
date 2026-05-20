from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from models import Notification


async def create_notification(
    db: AsyncSession,
    user_id: int,
    title: str,
    message: str,
    link: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
):
    db.add(
        Notification(
            user_id=user_id,
            title=title,
            message=message,
            link=link,
            entity_type=entity_type,
            entity_id=entity_id,
        )
    )


async def create_notifications_bulk(
    db: AsyncSession,
    items: list[tuple[int, str, str, Optional[str], Optional[str], Optional[int]]],
) -> None:
    for user_id, title, message, link, entity_type, entity_id in items:
        db.add(
            Notification(
                user_id=user_id,
                title=title,
                message=message,
                link=link,
                entity_type=entity_type,
                entity_id=entity_id,
            )
        )
