from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime, date
from model_enums import ConferenceStatusEnum, FormatEnum

class ConferenceCreate(BaseModel):
    title: str
    short_name: Optional[str] = None
    description: Optional[str] = None
    topics: Optional[List[str]] = []
    start_date: date
    end_date: date
    submission_deadline: datetime
    review_deadline: datetime
    location: Optional[str] = None
    format: FormatEnum = FormatEnum.OFFLINE
    registration_fee: float = 0
    submission_fee: float = 0
    fee_required: bool = False
    early_bird_fee: Optional[float] = None
    early_bird_deadline: Optional[datetime] = None
    review_mode: str = "open"
class ConferenceUpdate(BaseModel):
    title: Optional[str] = None
    short_name: Optional[str] = None
    description: Optional[str] = None
    topics: Optional[List[str]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    submission_deadline: Optional[datetime] = None
    review_deadline: Optional[datetime] = None
    location: Optional[str] = None
    format: Optional[FormatEnum] = None
    status: Optional[ConferenceStatusEnum] = None
    registration_fee: Optional[float] = None
    submission_fee: Optional[float] = None
    fee_required: Optional[bool] = None
    early_bird_fee: Optional[float] = None
    early_bird_deadline: Optional[datetime] = None
    review_mode: Optional[str] = None
class ConferenceApprovalSubmit(BaseModel):
    comment: Optional[str] = None
class ConferenceModerationAction(BaseModel):
    action: str = Field(..., pattern="^(approve|request_changes|reject)$")
    comment: Optional[str] = None
class ConferenceResponse(BaseModel):
    id: int
    organizer_id: int
    title: str
    short_name: Optional[str] = None
    description: Optional[str] = None
    topics: Optional[List[str]] = []
    start_date: date
    end_date: date
    submission_deadline: datetime
    review_deadline: datetime
    location: Optional[str] = None
    format: FormatEnum
    status: ConferenceStatusEnum
    registration_fee: float = 0
    submission_fee: float = 0
    fee_required: bool = False
    early_bird_fee: Optional[float] = None
    early_bird_deadline: Optional[datetime] = None
    review_mode: str = "open"
    moderation_comment: Optional[str] = None
    moderated_by: Optional[int] = None
    moderated_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
class RegistrationCreate(BaseModel):
    registration_type: str = "listener"
    accept_terms: bool = False
    promo_code: Optional[str] = None


class RegistrationResponse(BaseModel):
    id: int
    conference_id: int
    user_id: int
    registration_type: str
    status: str
    registered_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_country: Optional[str] = None
    conference_title: Optional[str] = None
    short_name: Optional[str] = None

    class Config:
        from_attributes = True


class ConferenceTrackCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None


class ConferenceTrackResponse(BaseModel):
    id: int
    conference_id: int
    name: str
    slug: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class ConferenceRoleCreate(BaseModel):
    user_id: int
    role: str
    track_id: Optional[int] = None


class ConferenceRoleResponse(BaseModel):
    id: int
    conference_id: int
    user_id: int
    role: str
    track_id: Optional[int] = None

    class Config:
        from_attributes = True


class ConferenceManageAccessResponse(BaseModel):
    access: str
    track_ids: Optional[List[int]] = None


class SubmissionDayCount(BaseModel):
    date: str
    count: int
class ConferenceAnalyticsResponse(BaseModel):
    submissions_by_day: List[SubmissionDayCount]
    status_breakdown: dict[str, int]
    reviewer_assigned: int
    reviewer_completed: int
    registrations_count: int
    papers_count: int
class AdminSummary(BaseModel):
    users_total: int
    users_active: int
    users_blocked: int
    users_by_role: dict[str, int]
    conferences_total: int
    conferences_by_status: dict[str, int]
class AdminAuditLogResponse(BaseModel):
    id: int
    actor_id: int
    actor_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: int
    before: dict[str, Any] = {}
    after: dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True
class SiteBlockItem(BaseModel):
    """Элемент галереи или записи сборника."""
    id: Optional[str] = None
    url: Optional[str] = None
    caption: Optional[str] = None
    year: Optional[int] = None
    title: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
class SiteBlock(BaseModel):
    id: Optional[str] = None
    type: str = "text"
    title: Optional[str] = None
    content: Optional[str] = None
    items: Optional[List[SiteBlockItem]] = None
class SitePage(BaseModel):
    id: str
    slug: str = ""
    title: str
    show_in_nav: bool = True
    is_home: bool = False
    blocks: List[SiteBlock] = []
class SiteSettings(BaseModel):
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    accent_color: str = "#2563eb"
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    cfp_text: Optional[str] = None
    contact_email: Optional[str] = None
    show_program: bool = True
    show_topics: bool = True
    show_deadlines: bool = True
    show_cfp: bool = True
    custom_blocks: Optional[List[dict]] = []
    pages: List[SitePage] = []
    home_page_id: Optional[str] = None
class SiteResponse(BaseModel):
    conference_id: int
    theme_json: dict
    is_published: bool
    published_at: Optional[datetime] = None

    class Config:
        from_attributes = True
class ProgramItemCreate(BaseModel):
    title: str
    authors: Optional[str] = None
    paper_id: Optional[int] = None
    start_time: datetime
    end_time: datetime
    order: int = 0
class ProgramSessionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    room: Optional[str] = None
    items: List[ProgramItemCreate] = []
class ProgramItemResponse(BaseModel):
    id: int
    session_id: int
    paper_id: Optional[int]
    title: str
    authors: Optional[str]
    start_time: datetime
    end_time: datetime
    order: int

    class Config:
        from_attributes = True
class ProgramSessionResponse(BaseModel):
    id: int
    conference_id: int
    title: str
    description: Optional[str]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    room: Optional[str]
    items: List[ProgramItemResponse] = []

    class Config:
        from_attributes = True
from schemas.proceedings import ProceedingsIssueResponse


class PublicConferenceResponse(ConferenceResponse):
    site: Optional[SiteResponse] = None
    program: Optional[List[ProgramSessionResponse]] = None
    proceedings: Optional[ProceedingsIssueResponse] = None
