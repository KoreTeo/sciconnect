from datetime import datetime, timezone

from fastapi import HTTPException

from models import Conference, ConferenceStatusEnum, User


def apply_moderation_action(conference: Conference, action: str, comment: str | None, moderator: User) -> tuple[dict, dict]:
    if conference.status != ConferenceStatusEnum.PENDING_APPROVAL:
        raise HTTPException(status_code=400, detail="Конференция не находится на модерации")
    if action in ("request_changes", "reject") and not comment:
        raise HTTPException(status_code=400, detail="Для возврата или отклонения нужна причина")

    before = {
        "status": conference.status,
        "moderation_comment": conference.moderation_comment,
        "moderated_by": conference.moderated_by,
    }
    if action == "approve":
        conference.status = ConferenceStatusEnum.SUBMISSION_OPEN
        conference.moderation_comment = comment or None
    elif action == "request_changes":
        conference.status = ConferenceStatusEnum.DRAFT
        conference.moderation_comment = comment
    else:
        conference.status = ConferenceStatusEnum.REJECTED
        conference.moderation_comment = comment

    conference.moderated_by = moderator.id
    conference.moderated_at = datetime.now(timezone.utc)
    after = {
        "status": conference.status,
        "moderation_comment": conference.moderation_comment,
        "moderated_by": conference.moderated_by,
    }
    return before, after
