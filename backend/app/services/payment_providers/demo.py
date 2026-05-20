from datetime import datetime, timezone
from decimal import Decimal
import uuid
from typing import Any

from models import Payment, PaymentStatusEnum
from services.payment_providers.base import PaymentInit, WebhookResult


class DemoPaymentProvider:
    name = "demo"

    def create_payment(
        self,
        amount: Decimal,
        currency: str,
        *,
        metadata: dict[str, Any] | None = None,
    ) -> PaymentInit:
        return PaymentInit(
            provider=self.name,
            external_id=str(uuid.uuid4()),
            payment_url=None,
        )

    def parse_webhook(self, payload: dict[str, Any], headers: dict[str, str]) -> WebhookResult:
        return WebhookResult(
            external_id=str(payload.get("external_id", "")),
            status=str(payload.get("status", PaymentStatusEnum.PAID.value)),
            provider=self.name,
        )

    def mark_paid(self, payment: Payment) -> Payment:
        if payment.status != PaymentStatusEnum.PAID:
            payment.status = PaymentStatusEnum.PAID
            payment.paid_at = datetime.now(timezone.utc)
        return payment
