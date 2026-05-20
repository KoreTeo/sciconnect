from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime, date

from schemas.papers import PaperAuthorResponse

class ProceedingsEntryUpdate(BaseModel):
    doi: Optional[str] = None
    pages: Optional[str] = None
    order: Optional[int] = None
    published_title: Optional[str] = None
    published_abstract: Optional[str] = None
class ProceedingsIssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    isbn: Optional[str] = None
    doi_prefix: Optional[str] = None
class ProceedingsAddEntry(BaseModel):
    paper_id: int
class ProceedingsEntryResponse(BaseModel):
    id: int
    issue_id: int
    paper_id: int
    doi: Optional[str] = None
    pages: Optional[str] = None
    order: int = 0
    published_title: Optional[str] = None
    published_abstract: Optional[str] = None
    paper_title: Optional[str] = None
    paper_abstract: Optional[str] = None
    paper_keywords: Optional[List[str]] = []
    paper_file_url: Optional[str] = None
    author_name: Optional[str] = None
    co_authors: Optional[List[PaperAuthorResponse]] = []

    class Config:
        from_attributes = True
class ProceedingsIssueResponse(BaseModel):
    id: int
    conference_id: int
    title: str
    description: Optional[str] = None
    isbn: Optional[str] = None
    doi_prefix: Optional[str] = None
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: datetime
    entries: List[ProceedingsEntryResponse] = []

    class Config:
        from_attributes = True
class ProceedingsExportEntry(BaseModel):
    paper_id: int
    title: str
    abstract: str
    keywords: List[str] = []
    authors: List[str] = []
    author_orcid: Optional[str] = None
    doi: Optional[str] = None
    pages: Optional[str] = None
class ProceedingsExportResponse(BaseModel):
    conference_id: int
    issue_title: str
    isbn: Optional[str] = None
    doi_prefix: Optional[str] = None
    entries: List[ProceedingsExportEntry]
