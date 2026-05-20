from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime, date
from model_enums import RoleEnum

from schemas._common import _normalize_email, _validate_country_code, _validate_orcid_field

class UserCreate(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    full_name: str
    affiliation: str = Field(..., min_length=2, description="Организация / вуз")
    orcid: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = Field(None, description="Должность, степень")
    country: Optional[str] = Field(None, description="ISO 3166-1 alpha-2")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return _normalize_email(v)

    @field_validator("country")
    @classmethod
    def validate_country(cls, v: Optional[str]) -> Optional[str]:
        return _validate_country_code(v)


class UserOrganizerCreate(BaseModel):
    email: str
    password: str = Field(..., min_length=8)
    full_name: str
    organization: str = Field(..., min_length=2, description="Организация-организатор")
    phone: str = Field(..., min_length=6)
    website: Optional[str] = None
    position: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return _normalize_email(v)
class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return _normalize_email(v)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    affiliation: Optional[str] = None
    orcid: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    country: Optional[str] = None

    @field_validator("orcid")
    @classmethod
    def validate_orcid(cls, v: Optional[str]) -> Optional[str]:
        return _validate_orcid_field(v)

    @field_validator("country")
    @classmethod
    def validate_country(cls, v: Optional[str]) -> Optional[str]:
        return _validate_country_code(v)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)
class UserAdminUpdate(BaseModel):
    role: Optional[RoleEnum] = None
    is_active: Optional[bool] = None
class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    affiliation: Optional[str]
    orcid: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    country: Optional[str] = None
    role: RoleEnum
    is_active: bool
    email_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
class RefreshTokenRequest(BaseModel):
    refresh_token: str
class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return _normalize_email(v)
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)
class VerifyEmailRequest(BaseModel):
    token: str
class DashboardStats(BaseModel):
    conferences_count: int
    my_papers_count: int
    pending_reviews_count: int
    my_conferences_count: int
    unread_notifications: int
