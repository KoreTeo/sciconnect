import logging

from arq import create_pool
from arq.connections import RedisSettings

from config import settings
from schemas_email import EmailJob
from services.email_delivery import deliver_email

logger = logging.getLogger(__name__)

# Verification and password reset must not depend on email-worker alone.
_SYNC_TEMPLATES = frozenset({"verification", "password_reset"})

_arq_pool = None


async def _get_arq_pool():
    global _arq_pool
    if _arq_pool is None:
        _arq_pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    return _arq_pool


async def dispatch_email(job: EmailJob) -> None:
    if not settings.SMTP_HOST:
        logger.warning("SMTP_HOST empty; skip email to=%s template=%s", job.to, job.template)
        return
    if job.template in _SYNC_TEMPLATES or not settings.EMAIL_ASYNC:
        ok = deliver_email(job)
        if not ok:
            logger.error("Email NOT sent (sync): to=%s template=%s", job.to, job.template)
        return
    try:
        pool = await _get_arq_pool()
        job_id = await pool.enqueue_job("send_email_job", job.model_dump())
        logger.info("Email queued: id=%s to=%s template=%s", job_id, job.to, job.template)
    except Exception:
        logger.exception("Email enqueue failed, falling back to sync: to=%s", job.to)
        deliver_email(job)


async def close_email_pool() -> None:
    global _arq_pool
    if _arq_pool is not None:
        await _arq_pool.close()
        _arq_pool = None
