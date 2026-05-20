import pytest

from schemas_email import EmailJob
from services.email_renderer import render_email


def test_email_renderer_verification_contains_link():
    html, plain = render_email(
        "verification",
        {
            "headline": "Подтвердите email",
            "body": "Текст",
            "cta_url": "http://localhost:3000/verify-email?token=abc123",
            "cta_label": "Подтвердить",
        },
    )
    assert "verify-email?token=abc123" in html
    assert "verify-email?token=abc123" in plain
    assert "text/html" not in html
    assert "<!DOCTYPE html>" in html


@pytest.mark.asyncio
async def test_sync_fallback_when_email_async_false(monkeypatch):
    from config import settings

    monkeypatch.setattr(settings, "EMAIL_ASYNC", False)
    sent: list[tuple[str, str, str, str]] = []

    def fake_send(to, subject, html, plain, **kwargs):
        sent.append((to, subject, html, plain))
        return True

    monkeypatch.setattr("services.email.send_email_message", fake_send)

    from services.email_queue import dispatch_email

    await dispatch_email(
        EmailJob(
            template="password_reset",
            to="user@test.local",
            subject="Сброс пароля",
            context={
                "headline": "Сброс",
                "body": "Текст",
                "cta_url": "http://localhost:3000/reset-password?token=tok",
                "cta_label": "Сбросить",
            },
        )
    )

    assert len(sent) == 1
    assert sent[0][0] == "user@test.local"
    assert "reset-password?token=tok" in sent[0][2]


@pytest.mark.asyncio
async def test_enqueue_email_when_async(monkeypatch):
    from config import settings

    monkeypatch.setattr(settings, "EMAIL_ASYNC", True)
    enqueued: list[dict] = []

    class FakePool:
        async def enqueue_job(self, name, payload):
            enqueued.append({"name": name, "payload": payload})

    async def fake_pool():
        return FakePool()

    monkeypatch.setattr("services.email_queue._get_arq_pool", fake_pool)

    from services.email_queue import dispatch_email

    await dispatch_email(
        EmailJob(
            template="generic_notification",
            to="org@test.local",
            subject="Тест",
            context={"headline": "Заголовок", "body": "Тело", "link": "/dashboard"},
        )
    )

    assert len(enqueued) == 1
    assert enqueued[0]["name"] == "send_email_job"
    assert enqueued[0]["payload"]["template"] == "generic_notification"


@pytest.mark.asyncio
async def test_notify_user_uses_generic_template(client, db_session, monkeypatch):
    from config import settings
    from services.email_queue import dispatch_email

    monkeypatch.setattr(settings, "EMAIL_ASYNC", False)
    dispatched: list[EmailJob] = []

    async def capture(job: EmailJob):
        dispatched.append(job)

    monkeypatch.setattr("services.notification_delivery.dispatch_email", capture)

    from conftest import user_by_email
    from services.notification_delivery import notify_user

    author = await user_by_email(db_session, "author@test.local")
    await notify_user(
        db_session,
        user_id=author.id,
        title="Тест",
        message="Сообщение in-app",
        link="/papers/1",
        email_subject="Тема письма",
        email_body="Текст письма",
    )

    assert len(dispatched) == 1
    assert dispatched[0].template == "generic_notification"
    assert dispatched[0].subject == "Тема письма"
