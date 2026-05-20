import re

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime, date

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _normalize_email(value: str) -> str:
    v = value.strip().lower()
    if not EMAIL_RE.match(v):
        raise ValueError("Некорректный email")
    return v


def _validate_orcid_field(v: Optional[str]) -> Optional[str]:
    if v is None or not str(v).strip():
        return None
    from services.orcid import normalize_orcid

    return normalize_orcid(v)


_COUNTRY_RE = re.compile(r"^[A-Z]{2}$")


def _validate_country_code(v: Optional[str]) -> Optional[str]:
    if v is None or not str(v).strip():
        return None
    code = str(v).strip().upper()
    if not _COUNTRY_RE.match(code):
        raise ValueError("Код страны должен быть в формате ISO 3166-1 alpha-2")
    return code

