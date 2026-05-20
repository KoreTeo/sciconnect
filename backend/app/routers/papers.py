from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from dependencies import get_current_user, require_verified_email
from models import Conference, ConferenceTrack, Paper, PaperRevisionRequest, PaperStatusEnum, User
from queries.papers import get_paper_or_404
from rbac import ensure_paper_actor
from schemas import (
    PaperCreate,
    PaperDetailResponse,
    PaperResponse,
    PaperRevisionRequestCreate,
    PaperUpdate,
)
from services.conference_access import ensure_conference_managed, get_conference_paper_access, get_managed_conference
from services.payment_gates import has_paid_payment
from services.payment_pricing import fee_required_for_purpose
from services.csv_export import csv_streaming_response
from services.paper_authors import sync_co_authors
from services.paper_export import PAPERS_CSV_HEADERS, build_papers_csv_rows
from services.paper_files import save_paper_pdf
from services.paper_queries import get_paper_detail
from services.paper_workflow import (
    create_paper,
    create_paper_version,
    load_paper_for_submit,
    paper_response_with_revision_context,
    paper_responses_with_revision_context,
    request_paper_revision,
    submit_paper,
    withdraw_paper,
)
from services.rate_limit import require_rate_limit

router = APIRouter(prefix="/papers", tags=["Статьи"])


@router.post("/", response_model=PaperResponse, status_code=status.HTTP_201_CREATED)
async def create_paper_endpoint(
    paper_data: PaperCreate,
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_verified_email),
):
    result = await db.execute(select(Conference).where(Conference.id == conference_id))
    conference = result.scalar_one_or_none()
    if not conference:
        raise HTTPException(status_code=404, detail="Конференция не найдена")

    if paper_data.track_id is not None:
        track = await db.get(ConferenceTrack, paper_data.track_id)
        if not track or track.conference_id != conference.id:
            raise HTTPException(status_code=400, detail="Некорректный трек конференции")

    new_paper = await create_paper(db, conference, paper_data, current_user)
    await db.commit()
    await db.refresh(new_paper)
    return await paper_response_with_revision_context(db, new_paper)


@router.post("/{paper_id}/upload")
async def upload_paper_file(
    paper_id: int,
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_verified_email),
):
    await require_rate_limit(request, "papers:upload", limit=20, window_seconds=300)
    paper = await get_paper_or_404(db, paper_id)

    if paper.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Только автор может загружать файл")

    file_url, file_name = await save_paper_pdf(file)
    paper.file_url = file_url
    paper.file_name = file_name
    await create_paper_version(db, paper, current_user.id)
    await db.commit()

    return {"message": "Файл успешно загружен", "file_url": paper.file_url}


@router.post("/{paper_id}/submit", response_model=PaperResponse)
async def submit_paper_endpoint(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_verified_email),
):
    paper = await load_paper_for_submit(db, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Статья не найдена")

    paper = await submit_paper(db, paper, current_user)
    await db.commit()
    await db.refresh(paper)
    return await paper_response_with_revision_context(db, paper)


@router.post("/{paper_id}/withdraw", response_model=PaperResponse)
async def withdraw_paper_endpoint(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = await get_paper_or_404(db, paper_id)

    paper = await withdraw_paper(db, paper, current_user)
    await db.commit()
    await db.refresh(paper)
    return await paper_response_with_revision_context(db, paper)


@router.get("/my", response_model=List[PaperResponse])
async def get_my_papers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Paper, Conference)
        .join(Conference, Paper.conference_id == Conference.id)
        .where(Paper.author_id == current_user.id)
        .order_by(Paper.id.desc())
        .offset(skip)
        .limit(limit)
    )
    rows = result.all()
    papers = [paper for paper, _ in rows]
    responses = await paper_responses_with_revision_context(db, papers)
    enriched: list[PaperResponse] = []
    for (paper, conf), response in zip(rows, responses):
        payment_pending = False
        if paper.status in (PaperStatusEnum.DRAFT, PaperStatusEnum.REVISION_REQUIRED) and fee_required_for_purpose(
            conf, "submission"
        ):
            payment_pending = not await has_paid_payment(
                db,
                user_id=current_user.id,
                conference_id=conf.id,
                purpose="submission",
                paper_id=paper.id,
            )
        enriched.append(response.model_copy(update={"payment_pending": payment_pending}))
    return enriched


@router.get("/conference/{conference_id}", response_model=List[PaperResponse])
async def get_conference_papers(
    conference_id: int,
    status_filter: Optional[PaperStatusEnum] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _, track_ids = await get_conference_paper_access(db, conference_id, current_user)

    query = select(Paper).where(Paper.conference_id == conference_id)
    if track_ids is not None:
        query = query.where(Paper.track_id.in_(track_ids))
    if status_filter:
        query = query.where(Paper.status == status_filter)
    result = await db.execute(query.order_by(Paper.id.desc()).offset(skip).limit(limit))
    return await paper_responses_with_revision_context(db, list(result.scalars().all()))


@router.get("/{paper_id}", response_model=PaperDetailResponse)
async def get_paper(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Paper)
        .where(Paper.id == paper_id)
        .options(
            selectinload(Paper.conference),
            selectinload(Paper.author),
            selectinload(Paper.co_authors),
            selectinload(Paper.versions),
            selectinload(Paper.revision_requests).selectinload(PaperRevisionRequest.requester),
        )
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Статья не найдена")

    return await get_paper_detail(db, paper, current_user)


@router.post("/{paper_id}/request-revision", response_model=PaperResponse)
async def request_paper_revision_endpoint(
    paper_id: int,
    data: PaperRevisionRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Paper)
        .where(Paper.id == paper_id)
        .options(selectinload(Paper.conference), selectinload(Paper.author))
    )
    paper = result.scalar_one_or_none()
    if not paper or not paper.conference:
        raise HTTPException(status_code=404, detail="Статья не найдена")

    await ensure_conference_managed(db, paper.conference, current_user, detail="Доступ только для организатора")
    paper = await request_paper_revision(db, paper, data, current_user)
    await db.commit()
    await db.refresh(paper)
    return await paper_response_with_revision_context(db, paper)


@router.get("/conference/{conference_id}/export")
async def export_conference_papers_csv(
    conference_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await get_managed_conference(db, conference_id, current_user)
    rows = await build_papers_csv_rows(db, conference_id)
    return csv_streaming_response(PAPERS_CSV_HEADERS, rows, f"papers_{conference_id}.csv")


@router.put("/{paper_id}", response_model=PaperResponse)
async def update_paper(
    paper_id: int,
    paper_data: PaperUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = await get_paper_or_404(db, paper_id)

    if paper.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Только автор может редактировать статью")

    if paper.status not in (PaperStatusEnum.DRAFT, PaperStatusEnum.REVISION_REQUIRED):
        raise HTTPException(status_code=400, detail=f"Нельзя редактировать статью со статусом {paper.status.value}")

    data = paper_data.model_dump(exclude_unset=True)
    co_authors = data.pop("co_authors", None)
    for field, value in data.items():
        setattr(paper, field, value)
    if co_authors is not None:
        await sync_co_authors(db, paper_id, co_authors)

    paper.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(paper)
    return await paper_response_with_revision_context(db, paper)


@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_paper(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Paper).where(Paper.id == paper_id).options(selectinload(Paper.conference))
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Статья не найдена")

    ensure_paper_actor(paper, current_user)

    if paper.author_id == current_user.id and paper.status != PaperStatusEnum.DRAFT:
        raise HTTPException(status_code=400, detail="Автор может удалить только черновик")

    await db.delete(paper)
    await db.commit()
