"""Backward-compatible re-export for payment provider access."""

from services.payment_providers.registry import get_payment_provider

payment_provider = get_payment_provider()

__all__ = ["get_payment_provider", "payment_provider"]
