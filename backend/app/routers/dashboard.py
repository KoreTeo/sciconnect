import asyncio

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models import User, Conference, Paper, Review, Notification, RoleEnum, ConferenceStatusEnum
from schemas import DashboardStats
from dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Кабинет"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conf_count_q = select(func.count()).select_from(Conference).where(
        Conference.status != ConferenceStatusEnum.DRAFT
    )
    papers_count_q = select(func.count()).select_from(Paper).where(Paper.author_id == current_user.id)
    reviews_count_q = (
        select(func.count())
        .select_from(Review)
        .where(Review.reviewer_id == current_user.id, Review.recommendation.is_(None))
    )
    unread_q = (
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
    )

    if current_user.role in (RoleEnum.ORGANIZER, RoleEnum.ADMIN):
        my_conf_q = select(func.count()).select_from(Conference).where(
            Conference.organizer_id == current_user.id
        )
        conf_count, papers_count, reviews_count, my_conf, unread = await asyncio.gather(
            db.scalar(conf_count_q),
            db.scalar(papers_count_q),
            db.scalar(reviews_count_q),
            db.scalar(my_conf_q),
            db.scalar(unread_q),
        )
    else:
        conf_count, papers_count, reviews_count, unread = await asyncio.gather(
            db.scalar(conf_count_q),
            db.scalar(papers_count_q),
            db.scalar(reviews_count_q),
            db.scalar(unread_q),
        )
        my_conf = 0

    return DashboardStats(
        conferences_count=conf_count or 0,
        my_papers_count=papers_count or 0,
        pending_reviews_count=reviews_count or 0,
        my_conferences_count=my_conf or 0,
        unread_notifications=unread or 0,
    )
