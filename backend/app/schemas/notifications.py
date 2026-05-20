from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime, date

class NotificationChannelPrefs(BaseModel):
    email: bool = True
    in_app: bool = True
class NotificationPreferencesResponse(BaseModel):
    papers: NotificationChannelPrefs
    reviews: NotificationChannelPrefs
    conferences: NotificationChannelPrefs
class NotificationPreferencesUpdate(BaseModel):
    papers: Optional[NotificationChannelPrefs] = None
    reviews: Optional[NotificationChannelPrefs] = None
    conferences: Optional[NotificationChannelPrefs] = None
