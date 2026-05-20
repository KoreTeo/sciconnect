from datetime import datetime, timezone
from decimal import Decimal

from models import Conference


def _aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def base_registration_fee(conf: Conference, *, now: datetime | None = None) -> Decimal:
    current = _aware(now) or datetime.now(timezone.utc)
    early_deadline = _aware(conf.early_bird_deadline)
    early_fee = conf.early_bird_fee
    if early_deadline and early_fee is not None and current < early_deadline:
        return Decimal(str(early_fee))
    return Decimal(str(conf.registration_fee or 0))


def base_submission_fee(conf: Conference) -> Decimal:
    return Decimal(str(conf.submission_fee or 0))


def apply_promo_discount(amount: Decimal, *, discount_percent: Decimal = Decimal("0"), discount_fixed: Decimal = Decimal("0")) -> Decimal:
    discounted = amount
    if discount_percent > 0:
        discounted = discounted * (Decimal("100") - discount_percent) / Decimal("100")
    if discount_fixed > 0:
        discounted = discounted - discount_fixed
    return max(discounted, Decimal("0")).quantize(Decimal("0.01"))


def fee_required_for_purpose(conf: Conference, purpose: str) -> bool:
    if not conf.fee_required:
        return False
    if purpose == "registration":
        return base_registration_fee(conf) > 0
    if purpose == "submission":
        return base_submission_fee(conf) > 0
    return False
