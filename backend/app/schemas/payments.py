from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime, date

class PaymentCreate(BaseModel):
    conference_id: int
    paper_id: Optional[int] = None
    registration_id: Optional[int] = None
    purpose: str = "registration"
    promo_code: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    conference_id: int
    amount: float
    currency: str
    status: str
    provider: str
    external_id: Optional[str] = None
    payment_url: Optional[str] = None
    purpose: Optional[str] = None
    paper_id: Optional[int] = None
    registration_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
class PaymentWebhookPayload(BaseModel):
    external_id: str
    status: str = "paid"
