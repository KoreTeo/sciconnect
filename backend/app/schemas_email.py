from typing import Any, Optional

from pydantic import BaseModel, Field


class EmailJob(BaseModel):
    template: str
    to: str = Field(min_length=3)
    subject: str
    context: dict[str, Any] = {}
    reply_to: Optional[str] = None
