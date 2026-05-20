from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Paper, PaperRevisionRequest, Review, RoleEnum, User
from rbac import has_role
from schemas import (
    PaperAuthorResponse,
    PaperDetailResponse,
    PaperRevisionRequestResponse,
    PaperVersionResponse,
    ReviewResponse,
)
from services.conference_roles import user_manages_conference
from services.paper_workflow import paper_response_with_revision_context
from services.review_queries import build_review_responses
from services.review_visibility import mask_author_name, should_mask_author_from_reviewer


async def get_paper_detail(db: AsyncSession, paper: Paper, current_user: User) -> PaperDetailResponse:
    reviews_result = await db.execute(
        select(Review).where(Review.paper_id == paper.id).options(selectinload(Review.reviewer))
    )
    reviews = list(reviews_result.scalars().all())

    manages_conference = paper.conference and await user_manages_conference(db, paper.conference, current_user)
    is_reviewer = any(review.reviewer_id == current_user.id for review in reviews)

    if (
        paper.author_id != current_user.id
        and not manages_conference
        and not is_reviewer
        and not has_role(current_user, RoleEnum.ADMIN)
    ):
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    base = await paper_response_with_revision_context(db, paper)
    author_name = paper.author.full_name if paper.author else None
    if (
        is_reviewer
        and paper.author_id != current_user.id
        and not manages_conference
        and not has_role(current_user, RoleEnum.ADMIN)
        and should_mask_author_from_reviewer(paper.conference)
    ):
        author_name = mask_author_name(author_name)

    paper_detail = PaperDetailResponse(
        **base.model_dump(),
        conference_title=paper.conference.title if paper.conference else None,
        author_name=author_name,
        reviews=None,
    )

    if manages_conference or paper.author_id == current_user.id or has_role(current_user, RoleEnum.ADMIN):
        paper_detail.reviews = build_review_responses(reviews, paper=paper, current_user=current_user)

    co_authors = sorted(paper.co_authors or [], key=lambda author: (author.order, author.id))
    paper_detail.co_authors = [PaperAuthorResponse.model_validate(author) for author in co_authors]
    paper_detail.versions = [
        PaperVersionResponse.model_validate(version)
        for version in sorted(paper.versions or [], key=lambda version: version.version_number, reverse=True)
    ]
    revision_requests = []
    for request in sorted(paper.revision_requests or [], key=lambda item: item.round_number, reverse=True):
        item = PaperRevisionRequestResponse.model_validate(request)
        if request.requester:
            item = item.model_copy(update={"requester_name": request.requester.full_name})
        revision_requests.append(item)
    paper_detail.revision_requests = revision_requests

    return paper_detail
