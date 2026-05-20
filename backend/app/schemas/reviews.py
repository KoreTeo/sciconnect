from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime, date
from model_enums import PaperStatusEnum, RecommendationEnum

class ReviewResponse(BaseModel):
    id: int
    paper_id: int
    reviewer_id: int
    score_relevance: Optional[int] = None
    score_novelty: Optional[int] = None
    score_clarity: Optional[int] = None
    score_methodology: Optional[int] = None
    comment_for_author: Optional[str] = None
    comment_for_chair: Optional[str] = None
    recommendation: Optional[str] = None
    submitted_at: datetime
    reviewer_name: Optional[str] = None
    paper_title: Optional[str] = None
    conference_id: Optional[int] = None
    conference_title: Optional[str] = None
    review_deadline: Optional[datetime] = None
    conflict_declared: bool = False

    class Config:
        from_attributes = True

    @field_validator("recommendation", mode="before")
    @classmethod
    def recommendation_to_str(cls, v):
        return v.value if hasattr(v, "value") else v
class ReviewProgressSummary(BaseModel):
    papers_total: int
    assignments_total: int
    reviews_completed: int
    reviews_pending: int
    reviews_overdue: int
    review_deadline: datetime
class ReviewAssignmentReviewer(BaseModel):
    review_id: int
    reviewer_id: int
    reviewer_name: Optional[str] = None
    reviewer_email: Optional[str] = None
    recommendation: Optional[str] = None
    submitted_at: datetime
    updated_at: Optional[datetime] = None
    is_completed: bool
    is_overdue: bool
class ReviewAssignmentResponse(BaseModel):
    paper_id: int
    paper_title: str
    paper_status: str
    author_name: Optional[str] = None
    assigned_reviewers: list[ReviewAssignmentReviewer]
    completed_reviews: int
    pending_reviews: int
    is_overdue: bool
class ReviewCreate(BaseModel):
    paper_id: int
    score_relevance: int = Field(..., ge=1, le=5)
    score_novelty: int = Field(..., ge=1, le=5)
    score_clarity: int = Field(..., ge=1, le=5)
    score_methodology: int = Field(..., ge=1, le=5)
    comment_for_author: str
    comment_for_chair: Optional[str] = None
    recommendation: RecommendationEnum
class ReviewUpdate(BaseModel):
    score_relevance: Optional[int] = Field(None, ge=1, le=5)
    score_novelty: Optional[int] = Field(None, ge=1, le=5)
    score_clarity: Optional[int] = Field(None, ge=1, le=5)
    score_methodology: Optional[int] = Field(None, ge=1, le=5)
    comment_for_author: Optional[str] = None
    comment_for_chair: Optional[str] = None
    recommendation: Optional[RecommendationEnum] = None
class ReviewerAssign(BaseModel):
    user_id: int
    paper_id: int
class ReviewerResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True
class PaperDecision(BaseModel):
    status: PaperStatusEnum
