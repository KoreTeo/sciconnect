from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime, date
from model_enums import PaperStatusEnum

from schemas._common import _validate_orcid_field
from schemas.reviews import ReviewResponse

class PaperAuthorCreate(BaseModel):
    user_id: Optional[int] = None
    full_name: str
    affiliation: Optional[str] = None
    orcid: Optional[str] = None
    order: int = 0
    is_corresponding: bool = False

    @field_validator("orcid")
    @classmethod
    def validate_orcid(cls, v: Optional[str]) -> Optional[str]:
        return _validate_orcid_field(v)
class PaperAuthorResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    full_name: str
    affiliation: Optional[str] = None
    orcid: Optional[str] = None
    order: int
    is_corresponding: bool

    class Config:
        from_attributes = True
class PaperCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=500)
    abstract: str = ""
    keywords: Optional[List[str]] = []
    co_authors: Optional[List[PaperAuthorCreate]] = []
    track_id: Optional[int] = None


class PaperUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    abstract: Optional[str] = None
    keywords: Optional[List[str]] = None
    co_authors: Optional[List[PaperAuthorCreate]] = None
    track_id: Optional[int] = None


class PaperResponse(BaseModel):
    id: int
    conference_id: int
    author_id: int
    track_id: Optional[int] = None
    title: str
    abstract: str
    keywords: Optional[List[str]] = []
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    status: str
    submitted_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    version_count: Optional[int] = None
    latest_revision_comment: Optional[str] = None
    latest_revision_round: Optional[int] = None
    payment_pending: Optional[bool] = None

    class Config:
        from_attributes = True

    @field_validator("status", mode="before")
    @classmethod
    def status_to_str(cls, v):
        return v.value if hasattr(v, "value") else v
class PaperVersionResponse(BaseModel):
    id: int
    paper_id: int
    version_number: int
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    title: str
    abstract: str
    keywords: Optional[List[str]] = []
    submitted_at: Optional[datetime] = None
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True
class PaperRevisionRequestCreate(BaseModel):
    comment: str = Field(..., min_length=5)


class BulkPaperRevisionRequestCreate(BaseModel):
    paper_ids: list[int] = Field(..., min_length=1)
    comment: str = Field(..., min_length=5)


class BulkRevisionSkipped(BaseModel):
    paper_id: int
    reason: str


class BulkPaperRevisionResponse(BaseModel):
    updated: list[PaperResponse]
    skipped: list[BulkRevisionSkipped]


class PaperRevisionRequestResponse(BaseModel):
    id: int
    paper_id: int
    requested_by: int
    requester_name: Optional[str] = None
    comment: str
    round_number: int
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
class PaperDetailResponse(PaperResponse):
    conference_title: Optional[str] = None
    author_name: Optional[str] = None
    co_authors: Optional[List[PaperAuthorResponse]] = None
    reviews: Optional[List[ReviewResponse]] = None
    versions: Optional[List[PaperVersionResponse]] = None
    revision_requests: Optional[List[PaperRevisionRequestResponse]] = None
