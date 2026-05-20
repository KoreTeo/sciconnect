import logging

from schemas_email import EmailJob
from services.email_renderer import render_email

logger = logging.getLogger(__name__)


def deliver_email(job: EmailJob) -> bool:
    from services.email import send_email_message

    html, plain = render_email(job.template, job.context)
    ok = send_email_message(job.to, job.subject, html, plain, reply_to=job.reply_to)
    if not ok:
        logger.warning("Failed to send email to %s subject=%s", job.to, job.subject)
    return ok
