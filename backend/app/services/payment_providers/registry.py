from functools import lru_cache

from config import settings
from services.payment_providers.base import PaymentProvider
from services.payment_providers.demo import DemoPaymentProvider

_PROVIDERS: dict[str, type] = {
    "demo": DemoPaymentProvider,
}


@lru_cache
def get_payment_provider(name: str | None = None) -> PaymentProvider:
    provider_name = (name or settings.PAYMENT_PROVIDER or "demo").lower()
    provider_cls = _PROVIDERS.get(provider_name)
    if not provider_cls:
        raise ValueError(f"Unknown payment provider: {provider_name}")
    return provider_cls()
