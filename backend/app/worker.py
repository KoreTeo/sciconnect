import logging

from arq.connections import RedisSettings

from config import settings

logger = logging.getLogger(__name__)
from schemas_email import EmailJob
from services.email_delivery import deliver_email


async def send_email_job(_ctx, payload: dict) -> bool:
    job = EmailJob.model_validate(payload)
    ok = deliver_email(job)
    if ok:
        logger.info("Worker sent email to=%s template=%s", job.to, job.template)
    else:
        logger.error("Worker failed email to=%s template=%s", job.to, job.template)
    return ok


class WorkerSettings:
    functions = [send_email_job]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    max_tries = 3
    retry_jobs = True
    job_timeout = 120
