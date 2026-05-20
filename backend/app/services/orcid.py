import re
from typing import Optional

ORCID_PATTERN = re.compile(
    r"^(\d{4}-\d{4}-\d{4}-\d{3}[\dX])$",
    re.IGNORECASE,
)


def normalize_orcid(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    cleaned = cleaned.replace("https://orcid.org/", "").replace("http://orcid.org/", "")
    cleaned = cleaned.upper()
    if not ORCID_PATTERN.match(cleaned):
        raise ValueError("Некорректный формат ORCID (пример: 0000-0002-1825-0097)")
    return cleaned


def orcid_profile_url(orcid: Optional[str]) -> Optional[str]:
    if not orcid:
        return None
    return f"https://orcid.org/{orcid}"
