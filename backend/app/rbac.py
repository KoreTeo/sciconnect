from fastapi import Depends, HTTPException, status
from models import ConferenceStatusEnum, RoleEnum, User
from dependencies import get_current_user


def has_role(user: User, *roles: RoleEnum) -> bool:
    if isinstance(user.role, RoleEnum):
        return user.role in roles
    return user.role in [r.value for r in roles]


def ensure_admin(user: User, detail: str = "Только для администраторов") -> User:
    if not has_role(user, RoleEnum.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
    return user


def ensure_conference_manager(conference, user: User, detail: str = "Доступ запрещён") -> None:
    if conference.organizer_id != user.id and not has_role(user, RoleEnum.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def ensure_paper_actor(paper, user: User, *, allow_author: bool = True, allow_organizer: bool = True, detail: str = "Доступ запрещён") -> None:
    is_author = allow_author and paper.author_id == user.id
    is_organizer = allow_organizer and paper.conference and paper.conference.organizer_id == user.id
    if not is_author and not is_organizer and not has_role(user, RoleEnum.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def ensure_author(paper, user: User, detail: str = "Только автор может выполнить действие") -> None:
    if paper.author_id != user.id and not has_role(user, RoleEnum.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def ensure_reviewer_assignment(review, user: User, detail: str = "Доступно только назначенному рецензенту") -> None:
    if review.reviewer_id != user.id and not has_role(user, RoleEnum.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def ensure_paper_viewer(paper, user: User, detail: str = "Доступ запрещён") -> None:
    is_reviewer = any(review.reviewer_id == user.id for review in getattr(paper, "reviews", []) or [])
    if paper.author_id == user.id or is_reviewer or has_role(user, RoleEnum.ADMIN):
        return
    if paper.conference and paper.conference.organizer_id == user.id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def ensure_public_conference_visible(conference, detail: str = "Конференция недоступна") -> None:
    if conference.status in (
        ConferenceStatusEnum.SUBMISSION_OPEN,
        ConferenceStatusEnum.REVIEWING,
        ConferenceStatusEnum.PROGRAMMING,
        ConferenceStatusEnum.COMPLETED,
    ):
        return
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


async def require_roles(*roles: RoleEnum):
    async def checker(current_user: User = Depends(get_current_user)) -> User:
        if not has_role(current_user, *roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав",
            )
        return current_user

    return checker


def require_organizer_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if not has_role(current_user, RoleEnum.ORGANIZER, RoleEnum.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Только для организаторов")
    return current_user
