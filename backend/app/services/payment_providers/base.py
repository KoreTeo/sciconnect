from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Protocol

from models import Payment


@dataclass(frozen=True)
class PaymentInit:
    provider: str
    external_id: str
    payment_url: str | None = None


@dataclass(frozen=True)
class WebhookResult:
    external_id: str
    status: str
    provider: str


class PaymentProvider(Protocol):
    name: str

    def create_payment(
        self,
        amount: Decimal,
        currency: str,
        *,
        metadata: dict[str, Any] | None = None,
    ) -> PaymentInit: ...

    def parse_webhook(self, payload: dict[str, Any], headers: dict[str, str]) -> WebhookResult: ...

    def mark_paid(self, payment: Payment) -> Payment: ...
