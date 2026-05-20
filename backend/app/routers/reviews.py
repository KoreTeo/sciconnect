from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from dependencies import get_current_user
from models import Conference, Paper, Review
from queries.reviews import get_review_or_404
from rbac import ensure_paper_actor
from schemas import (
    PaperDecision,
    PaperResponse,
    ReviewAssignmentResponse,
    ReviewCreate,
    ReviewProgressSummary,
    ReviewResponse,
    ReviewUpdate,
    ReviewerAssign,
    ReviewerResponse,
)
from services.conference_access import get_conference_paper_access, get_managed_conference
from services.csv_export import csv_streaming_response
from services.notification_delivery import notify_user
from services.review_assignments import (
    add_conference_reviewer,
    assign_reviewer_to_paper,
    list_conference_reviewers,
    list_review_assignments,
    remove_conference_reviewer,
    unassign_review,
)
from services.review_export import REVIEWS_CSV_HEADERS, build_reviews_csv_rows
from services.review_progress import get_review_progress_summary
from services.paper_workflow import paper_response_with_revision_context
from services.review_queries import fetch_my_reviews, fetch_paper_reviews_for_viewer
from services.review_workflow import (
    apply_paper_decision,
    apply_review_patch,
    apply_review_submission,
    ensure_review_deadline_open,
)

router = APIRouter(tags=["Рецензии"])


@router.get("/reviews/my", response_model=list[ReviewResponse])
async def get_my_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    paper_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await fetch_my_reviews(db, current_user, skip=skip, limit=limit, paper_id=paper_id)


@router.post("/reviews", response_model=ReviewResponse)
async def submit_review(
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Review)
        .where(
            Review.paper_id == data.paper_id,
            Review.reviewer_id == current_user.id,
        )
        .options(selectinload(Review.paper).selectinload(Paper.conference).selectinload(Conference.organizer))
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Рецензия не назначена")

    paper = review.paper
    if not paper or not paper.conference:
        raise HTTPException(status_code=404, detail="Статья не найдена")

    ensure_review_deadline_open(paper)
    apply_review_submission(review, data)

    if paper.conference.organizer:
        await notify_user(
            db,
            user_id=paper.conference.organizer_id,
            user=paper.conference.organizer,
            title="Рецензия отправлена",
            message=f'Рецензент отправил рецензию на статью «{paper.title}»',
            link=f"/conference-manage/{paper.conference_id}",
            email_subject=f"Рецензия отправлена: {paper.title}",
            email_body=f"Рецензент отправил рецензию на статью «{paper.title}».",
            entity_type="review",
            entity_id=review.id,
        )

    await db.commit()
    await db.refresh(review)
    return review


@router.post("/reviews/{paper_id}/declare-conflict")
async def declare_review_conflict(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Review).where(Review.paper_id == paper_id, Review.reviewer_id == current_user.id)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Рецензия не назначена")
    if review.recommendation is not None:
        raise HTTPException(status_code=400, detail="Нельзя заявить конфликт после отправки рецензии")
    review.conflict_declared = True
    await db.commit()
    return {"message": "Конфликт интересов зафиксирован"}


@router.put("/reviews/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    data: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Review)
        .where(Review.id == review_id)
        .options(selectinload(Review.paper).selectinload(Paper.conference).selectinload(Conference.organizer))
    )
    review = result.scalar_one_or_none()
    if not review or review.reviewer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Рецензия не найдена")

    if review.recommendation is not None:
        raise HTTPException(status_code=400, detail="Рецензия уже отправлена")

    if review.paper:
        ensure_review_deadline_open(review.paper)

    apply_review_patch(review, data)

    if review.recommendation is not None and review.paper and review.paper.conference:
        organizer = review.paper.conference.organizer
        await notify_user(
            db,
            user_id=review.paper.conference.organizer_id,
            user=organizer,
            title="Рецензия отправлена",
            message=f'Рецензент отправил рецензию на статью «{review.paper.title}»',
            link=f"/conference-manage/{review.paper.conference_id}",
            email_subject=f"Рецензия отправлена: {review.paper.title}",
            email_body=f"Рецензент отправил рецензию на статью «{review.paper.title}».",
            entity_type="review",
            entity_id=review.id,
        )

    await db.commit()
    await db.refresh(review)
    return review


@router.get("/papers/{paper_id}/reviews", response_model=list[ReviewResponse])
async def get_paper_reviews(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await fetch_paper_reviews_for_viewer(db, paper_id, current_user)


@router.get("/conferences/{conference_id}/review-progress", response_model=ReviewProgressSummary)
async def get_review_progress(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    conference = await get_managed_conference(db, conference_id, current_user)
    return await get_review_progress_summary(db, conference)


@router.get("/conferences/{conference_id}/review-assignments", response_model=list[ReviewAssignmentResponse])
async def get_review_assignments(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    conference, track_ids = await get_conference_paper_access(db, conference_id, current_user)
    return await list_review_assignments(db, conference, track_ids=track_ids)


@router.post("/conferences/{conference_id}/reviewers")
async def add_conference_reviewer_endpoint(
    conference_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await get_managed_conference(db, conference_id, current_user)
    message = await add_conference_reviewer(db, conference_id, user_id)
    await db.commit()
    return message


@router.delete("/conferences/{conference_id}/reviewers/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_conference_reviewer_endpoint(
    conference_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await get_managed_conference(db, conference_id, current_user)
    await remove_conference_reviewer(db, conference_id, user_id)
    await db.commit()


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_review_endpoint(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    review = await get_review_or_404(
        db,
        review_id,
        options=[selectinload(Review.paper).selectinload(Paper.conference)],
    )

    await unassign_review(db, review, current_user)
    await db.commit()


@router.get("/conferences/{conference_id}/reviewers", response_model=list[ReviewerResponse])
async def list_conference_reviewers_endpoint(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await get_managed_conference(db, conference_id, current_user)
    return await list_conference_reviewers(db, conference_id)


@router.post("/conferences/{conference_id}/assign-reviewer")
async def assign_reviewer_to_paper_endpoint(
    conference_id: int,
    data: ReviewerAssign,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    conference = await get_managed_conference(db, conference_id, current_user)
    message = await assign_reviewer_to_paper(db, conference, data)
    await db.commit()
    return message


@router.put("/papers/{paper_id}/decision", response_model=PaperResponse)
async def paper_decision(
    paper_id: int,
    decision: PaperDecision,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    paper_result = await db.execute(
        select(Paper)
        .where(Paper.id == paper_id)
        .options(selectinload(Paper.conference), selectinload(Paper.author))
    )
    paper = paper_result.scalar_one_or_none()
    if not paper or not paper.conference:
        raise HTTPException(status_code=404, detail="Статья не найдена")

    await get_managed_conference(db, paper.conference_id, current_user)
    paper = await apply_paper_decision(db, paper, decision)
    await db.commit()
    await db.refresh(paper)
    return await paper_response_with_revision_context(db, paper)


@router.get("/conference/{conference_id}/export")
async def export_conference_reviews_csv(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await get_managed_conference(db, conference_id, current_user)
    rows = await build_reviews_csv_rows(db, conference_id)
    return csv_streaming_response(REVIEWS_CSV_HEADERS, rows, f"reviews_{conference_id}.csv")
