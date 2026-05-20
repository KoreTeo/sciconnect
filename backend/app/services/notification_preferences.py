from typing import Any, Optional

NOTIFICATION_CATEGORIES = ("papers", "reviews", "conferences")

DEFAULT_CHANNEL_PREFS = {"email": True, "in_app": True}

DEFAULT_PREFERENCES: dict[str, dict[str, bool]] = {
    category: dict(DEFAULT_CHANNEL_PREFS) for category in NOTIFICATION_CATEGORIES
}

ENTITY_TYPE_TO_CATEGORY = {
    "paper": "papers",
    "review": "reviews",
    "conference": "conferences",
}


def normalize_preferences(raw: Optional[dict]) -> dict[str, dict[str, bool]]:
    prefs = {k: dict(DEFAULT_CHANNEL_PREFS) for k in NOTIFICATION_CATEGORIES}
    if not raw:
        return prefs
    for category in NOTIFICATION_CATEGORIES:
        stored = raw.get(category)
        if not isinstance(stored, dict):
            continue
        prefs[category] = {
            "email": bool(stored.get("email", True)),
            "in_app": bool(stored.get("in_app", True)),
        }
    return prefs


def category_for_entity(entity_type: Optional[str]) -> str:
    if entity_type and entity_type in ENTITY_TYPE_TO_CATEGORY:
        return ENTITY_TYPE_TO_CATEGORY[entity_type]
    return "papers"


def should_notify_in_app(user_prefs: Optional[dict], entity_type: Optional[str]) -> bool:
    prefs = normalize_preferences(user_prefs)
    category = category_for_entity(entity_type)
    return prefs[category]["in_app"]


def should_notify_email(user_prefs: Optional[dict], entity_type: Optional[str]) -> bool:
    prefs = normalize_preferences(user_prefs)
    category = category_for_entity(entity_type)
    return prefs[category]["email"]


def merge_preferences_update(
    current: Optional[dict], patch: dict[str, Any]
) -> dict[str, dict[str, bool]]:
    merged = normalize_preferences(current)
    for category, channels in patch.items():
        if category not in NOTIFICATION_CATEGORIES or not isinstance(channels, dict):
            continue
        if "email" in channels:
            merged[category]["email"] = bool(channels["email"])
        if "in_app" in channels:
            merged[category]["in_app"] = bool(channels["in_app"])
    return merged
