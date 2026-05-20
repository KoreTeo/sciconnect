import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

from config import settings
from schemas_email import EmailJob
from services.email_queue import dispatch_email
from services.email_renderer import build_frontend_url

logger = logging.getLogger(__name__)

__all__ = [
    "build_frontend_url",
    "send_email_message",
    "send_password_reset_email",
    "send_verification_email",
    "notify_reviewer_assigned",
    "notify_paper_status",
    "notify_paper_submitted",
    "notify_revision_requested",
    "notify_review_submitted",
    "notify_conference_moderation",
    "notify_conference_pending_admin",
]


def _from_header() -> str:
    if settings.SMTP_FROM_NAME:
        return formataddr((settings.SMTP_FROM_NAME, settings.SMTP_FROM))
    return settings.SMTP_FROM


def _smtp_login(server: smtplib.SMTP) -> None:
    user = (settings.SMTP_USER or "").strip()
    password = settings.SMTP_PASSWORD or ""
    if not user or not password:
        if settings.SMTP_HOST not in ("mailhog", "localhost", "127.0.0.1"):
            logger.error(
                "SMTP_USER/SMTP_PASSWORD not set (host=%s). Timeweb requires login.",
                settings.SMTP_HOST,
            )
        return
    server.login(user, password)


def send_email_message(
    to: str,
    subject: str,
    html: str,
    plain: str,
    *,
    reply_to: str | None = None,
) -> bool:
    if not settings.SMTP_HOST:
        logger.warning("SMTP_HOST is not set; skip send to %s", to)
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = _from_header()
        msg["To"] = to
        msg["Subject"] = subject
        if reply_to:
            msg["Reply-To"] = reply_to
        msg.attach(MIMEText(plain, "plain", "utf-8"))
        msg.attach(MIMEText(html, "html", "utf-8"))
        if settings.SMTP_USE_SSL:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                _smtp_login(server)
                server.sendmail(settings.SMTP_FROM, [to], msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()
                _smtp_login(server)
                server.sendmail(settings.SMTP_FROM, [to], msg.as_string())
        logger.info("SMTP sent to=%s subject=%s via %s:%s", to, subject, settings.SMTP_HOST, settings.SMTP_PORT)
        return True
    except Exception:
        logger.exception("SMTP send failed to=%s subject=%s host=%s:%s", to, subject, settings.SMTP_HOST, settings.SMTP_PORT)
        return False


def email_with_link(message: str, link: str | None = None) -> str:
    if link:
        return f"{message}\n\nОткрыть в SciConnect: {build_frontend_url(link)}"
    return message


async def send_password_reset_email(to: str, token: str) -> None:
    verify_url = build_frontend_url(f"reset-password?token={token}")
    await dispatch_email(
        EmailJob(
            template="password_reset",
            to=to,
            subject="Сброс пароля SciConnect",
            context={
                "headline": "Сброс пароля",
                "body": "Перейдите по ссылке, чтобы задать новый пароль.",
                "cta_url": verify_url,
                "cta_label": "Сбросить пароль",
            },
        )
    )


async def send_verification_email(to: str, token: str) -> None:
    verify_url = build_frontend_url(f"verify-email?token={token}")
    await dispatch_email(
        EmailJob(
            template="verification",
            to=to,
            subject="Подтвердите email в SciConnect",
            context={
                "headline": "Подтвердите email",
                "body": "Подтвердите адрес электронной почты для доступа ко всем функциям платформы.",
                "cta_url": verify_url,
                "cta_label": "Подтвердить email",
            },
        )
    )


async def notify_reviewer_assigned(
    reviewer_email: str,
    paper_title: str,
    conference_title: str,
    link: str = "/reviews",
) -> None:
    await dispatch_email(
        EmailJob(
            template="reviewer_assigned",
            to=reviewer_email,
            subject=f"Назначена рецензия: {paper_title}",
            context={
                "headline": "Назначена рецензия",
                "body": f"Вам назначена рецензия статьи «{paper_title}» на конференции «{conference_title}».",
                "paper_title": paper_title,
                "conference_title": conference_title,
                "link": link,
            },
        )
    )


async def notify_paper_status(
    author_email: str,
    paper_title: str,
    new_status: str,
    link: str | None = None,
) -> None:
    await dispatch_email(
        EmailJob(
            template="paper_status",
            to=author_email,
            subject=f"Статус статьи изменён: {paper_title}",
            context={
                "headline": "Статус статьи изменён",
                "body": f"Статус вашей статьи «{paper_title}» изменён на: {new_status}.",
                "paper_title": paper_title,
                "new_status": new_status,
                "link": link,
            },
        )
    )


async def notify_paper_submitted(
    organizer_email: str,
    paper_title: str,
    conference_title: str,
    link: str,
) -> None:
    await dispatch_email(
        EmailJob(
            template="paper_submitted",
            to=organizer_email,
            subject=f"Новая статья: {paper_title}",
            context={
                "headline": "Новая статья",
                "body": f"Автор подал статью «{paper_title}» на конференцию «{conference_title}».",
                "paper_title": paper_title,
                "conference_title": conference_title,
                "link": link,
            },
        )
    )


async def notify_revision_requested(
    author_email: str,
    paper_title: str,
    comment: str,
    link: str,
) -> None:
    await dispatch_email(
        EmailJob(
            template="revision_requested",
            to=author_email,
            subject=f"Требуется доработка: {paper_title}",
            context={
                "headline": "Требуется доработка",
                "body": f"По статье «{paper_title}» запрошена доработка.",
                "paper_title": paper_title,
                "comment": comment,
                "extra_plain": f"Комментарий: {comment}",
                "link": link,
            },
        )
    )


async def notify_review_submitted(organizer_email: str, paper_title: str, link: str) -> None:
    await dispatch_email(
        EmailJob(
            template="review_submitted",
            to=organizer_email,
            subject=f"Рецензия отправлена: {paper_title}",
            context={
                "headline": "Рецензия отправлена",
                "body": f"Рецензент отправил рецензию на статью «{paper_title}».",
                "paper_title": paper_title,
                "link": link,
            },
        )
    )


async def notify_conference_moderation(
    organizer_email: str,
    conference_title: str,
    status_label: str,
    link: str = "/my-conferences",
) -> None:
    await dispatch_email(
        EmailJob(
            template="conference_moderation",
            to=organizer_email,
            subject=f"Модерация конференции: {conference_title}",
            context={
                "headline": "Модерация конференции",
                "body": f"Конференция «{conference_title}»: {status_label}.",
                "conference_title": conference_title,
                "status_label": status_label,
                "link": link,
            },
        )
    )


async def notify_conference_pending_admin(
    admin_email: str,
    conference_title: str,
    link: str = "/admin",
) -> None:
    await dispatch_email(
        EmailJob(
            template="conference_pending_admin",
            to=admin_email,
            subject=f"Конференция на модерации: {conference_title}",
            context={
                "headline": "Конференция на модерации",
                "body": f"Конференция «{conference_title}» ожидает проверки администратором.",
                "conference_title": conference_title,
                "link": link,
            },
        )
    )
