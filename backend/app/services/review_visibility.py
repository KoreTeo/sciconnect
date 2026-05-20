from models import Conference, Paper, Review, User, ReviewModeEnum


def conference_review_mode(conf: Conference | None) -> str:
    if not conf or not conf.review_mode:
        return ReviewModeEnum.OPEN.value
    mode = conf.review_mode
    if hasattr(mode, "value"):
        return mode.value
    return str(mode)


def should_mask_reviewer_from_author(conf: Conference | None) -> bool:
    mode = conference_review_mode(conf)
    return mode in (ReviewModeEnum.SINGLE_BLIND.value, ReviewModeEnum.DOUBLE_BLIND.value)


def should_mask_author_from_reviewer(conf: Conference | None) -> bool:
    return conference_review_mode(conf) == ReviewModeEnum.DOUBLE_BLIND.value


def mask_reviewer_name(name: str | None) -> str | None:
    return "Рецензент" if name else None


def mask_author_name(name: str | None) -> str | None:
    return "Автор" if name else None


def apply_review_visibility(
    review: Review,
    *,
    paper: Paper,
    viewer: User,
    reviewer_name: str | None,
) -> str | None:
    conf = paper.conference
    is_author = paper.author_id == viewer.id
    is_reviewer = review.reviewer_id == viewer.id
    is_organizer = conf and conf.organizer_id == viewer.id
    is_admin = getattr(viewer.role, "value", viewer.role) == "admin"

    if is_organizer or is_admin:
        return reviewer_name

    if is_author and should_mask_reviewer_from_author(conf):
        return mask_reviewer_name(reviewer_name)

    if is_reviewer and should_mask_author_from_reviewer(conf):
        return reviewer_name

    return reviewer_name
