"""Демо-данные для SciConnect. Вызывается при старте API и вручную."""
import logging
import os
from datetime import datetime, timezone, timedelta

from sqlalchemy import select

from database import AsyncSessionLocal, engine, Base
from models import (
    User,
    Conference,
    Paper,
    ConferenceReviewer,
    ConferenceSite,
    RoleEnum,
    PaperStatusEnum,
    ConferenceStatusEnum,
    FormatEnum,
)
from auth import get_password_hash

logger = logging.getLogger(__name__)

# Старые .local-адреса не проходят строгую валидацию EmailStr — мигрируем при seed
EMAIL_ALIASES = {
    "admin@sciconnect.local": "admin@sciconnect.demo",
    "organizer@sciconnect.local": "organizer@sciconnect.demo",
    "reviewer1@sciconnect.local": "reviewer1@sciconnect.demo",
    "reviewer2@sciconnect.local": "reviewer2@sciconnect.demo",
    "author@sciconnect.local": "author@sciconnect.demo",
}

def _iccs2026_theme(conference_id: int | None = None) -> dict:
    """Компактный шаблон сайта ICCS 2026 (партнёры/контакты на главной)."""
    from services.site_theme import new_id

    home_id = new_id()
    invitation = (
        "<p>Приглашаем исследователей представить оригинальные работы "
        "на конференцию <strong>ICCS 2026</strong>.</p>"
    )
    cta = f"/submit-paper?conferenceId={conference_id}" if conference_id else ""
    contact = (
        '<p>По вопросам участия: '
        '<a href="mailto:organizer@sciconnect.demo">organizer@sciconnect.demo</a></p>'
    )
    return {
        "hero_title": "ICCS 2026",
        "hero_subtitle": "Международная конференция по компьютерным наукам",
        "accent_color": "#2563eb",
        "show_program": True,
        "show_topics": True,
        "show_deadlines": True,
        "show_cfp": False,
        "contact_email": "organizer@sciconnect.demo",
        "cfp_text": "Принимаются оригинальные статьи на русском и английском языках. Объём — до 8 страниц.",
        "nav_consolidated": True,
        "home_page_id": home_id,
        "pages": [
            {
                "id": home_id,
                "slug": "",
                "title": "Главная",
                "show_in_nav": True,
                "is_home": True,
                "blocks": [
                    {"id": new_id(), "type": "image", "title": "О конференции", "content": ""},
                    {"id": new_id(), "type": "deadlines", "title": "Ключевые даты"},
                    {"id": new_id(), "type": "text", "title": "Приглашение", "content": invitation},
                    {"id": new_id(), "type": "topics", "title": "Тематики"},
                    {
                        "id": new_id(),
                        "type": "sponsors",
                        "title": "Партнёры и спонсоры",
                        "content": "МГУ\nРФФИ\nТехнопарк",
                    },
                    {"id": new_id(), "type": "contact", "title": "Контакты", "content": contact},
                    {"id": new_id(), "type": "cta", "title": "Подать статью", "content": cta},
                ],
            },
            {
                "id": new_id(),
                "slug": "invitation",
                "title": "Приглашение",
                "show_in_nav": False,
                "blocks": [
                    {"id": new_id(), "type": "text", "title": "Приглашение к участию", "content": invitation},
                    {"id": new_id(), "type": "topics", "title": "Тематики"},
                ],
            },
            {
                "id": new_id(),
                "slug": "committee",
                "title": "Комитет",
                "show_in_nav": False,
                "blocks": [
                    {
                        "id": new_id(),
                        "type": "committee",
                        "title": "Программный комитет",
                        "content": "Председатель — проф. Иванов И.И.\nЧлен комитета — д-р Петров П.П.",
                    }
                ],
            },
            {
                "id": new_id(),
                "slug": "program",
                "title": "Программа",
                "show_in_nav": True,
                "blocks": [{"id": new_id(), "type": "program", "title": "Программа конференции"}],
            },
            {
                "id": new_id(),
                "slug": "venue",
                "title": "Место проведения",
                "show_in_nav": False,
                "blocks": [
                    {"id": new_id(), "type": "image", "title": "Фото площадки", "content": ""},
                    {
                        "id": new_id(),
                        "type": "venue",
                        "title": "Место проведения",
                        "content": "<p>Конференция пройдёт по адресу: <strong>Москва, МГУ</strong>.</p>",
                        "items": [{"url": "https://yandex.ru/maps/"}],
                    },
                ],
            },
            {
                "id": new_id(),
                "slug": "proceedings",
                "title": "Сборники",
                "show_in_nav": True,
                "blocks": [
                    {
                        "id": new_id(),
                        "type": "proceedings",
                        "title": "Архив материалов",
                        "items": [
                            {"id": new_id(), "year": 2025, "title": "Материалы ICCS 2025"},
                            {"id": new_id(), "year": 2024, "title": "Материалы ICCS 2024"},
                        ],
                    }
                ],
            },
            {
                "id": new_id(),
                "slug": "gallery",
                "title": "Галерея",
                "show_in_nav": True,
                "blocks": [{"id": new_id(), "type": "gallery", "title": "Фотогалерея", "items": []}],
            },
            {
                "id": new_id(),
                "slug": "partners",
                "title": "Партнёры",
                "show_in_nav": False,
                "blocks": [
                    {
                        "id": new_id(),
                        "type": "sponsors",
                        "title": "Партнёры и спонсоры",
                        "content": "МГУ\nРФФИ",
                    }
                ],
            },
            {
                "id": new_id(),
                "slug": "contacts",
                "title": "Контакты",
                "show_in_nav": False,
                "blocks": [{"id": new_id(), "type": "contact", "title": "Контакты", "content": contact}],
            },
        ],
    }


DEMO_USERS = [
    ("admin@sciconnect.demo", "admin123", "Администратор", RoleEnum.ADMIN),
    ("organizer@sciconnect.demo", "org123456", "Иван Организатор", RoleEnum.ORGANIZER),
    ("reviewer1@sciconnect.demo", "rev123456", "Пётр Рецензент", RoleEnum.REVIEWER),
    ("reviewer2@sciconnect.demo", "rev123456", "Анна Рецензент", RoleEnum.REVIEWER),
    ("author@sciconnect.demo", "user123456", "Мария Участник", RoleEnum.USER),
]


async def seed_demo() -> bool:
    """Возвращает True, если данные созданы или уже существуют."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        for old_email, new_email in EMAIL_ALIASES.items():
            r = await db.execute(select(User).where(User.email == old_email))
            u = r.scalar_one_or_none()
            if u:
                u.email = new_email
        await db.commit()

        users: dict[str, User] = {}
        for email, pwd, name, role in DEMO_USERS:
            r = await db.execute(select(User).where(User.email == email))
            u = r.scalar_one_or_none()
            if not u:
                u = User(
                    email=email,
                    password_hash=get_password_hash(pwd),
                    full_name=name,
                    affiliation="МГУ",
                    role=role,
                    email_verified=True,
                )
                db.add(u)
                await db.flush()
            users[email] = u

        await db.commit()

        r = await db.execute(select(Conference).where(Conference.short_name == "iccs2026"))
        existing = r.scalar_one_or_none()
        if existing:
            site_r = await db.execute(select(ConferenceSite).where(ConferenceSite.conference_id == existing.id))
            site = site_r.scalar_one_or_none()
            pages = (site.theme_json or {}).get("pages") if site else None
            slugs = {page.get("slug") for page in pages or []}
            has_required_pages = {"gallery", "proceedings"}.issubset(slugs)
            nav_consolidated = (site.theme_json or {}).get("nav_consolidated") if site else False
            force_demo_site = os.getenv("SCICONNECT_FORCE_DEMO_SITE") == "1"
            if site and (force_demo_site or not has_required_pages or not nav_consolidated):
                site.theme_json = _iccs2026_theme(existing.id)
                await db.commit()
                logger.info("Seed: обновлён theme_json сайта iccs2026 (pages)")
            else:
                logger.info("Seed: демо-данные уже есть (iccs2026)")
            return True

        org = users["organizer@sciconnect.demo"]
        now = datetime.now(timezone.utc)
        conf = Conference(
            organizer_id=org.id,
            title="Международная конференция по компьютерным наукам 2026",
            short_name="iccs2026",
            description="Ежегодная конференция для исследователей в области ИТ и компьютерных наук.",
            topics=["машинное обучение", "базы данных", "веб-технологии"],
            start_date=(now + timedelta(days=90)).date(),
            end_date=(now + timedelta(days=92)).date(),
            submission_deadline=now + timedelta(days=30),
            review_deadline=now + timedelta(days=60),
            location="Москва, МГУ",
            format=FormatEnum.HYBRID,
            status=ConferenceStatusEnum.SUBMISSION_OPEN,
        )
        db.add(conf)
        await db.flush()

        for email in ("reviewer1@sciconnect.demo", "reviewer2@sciconnect.demo"):
            db.add(ConferenceReviewer(conference_id=conf.id, user_id=users[email].id))

        author = users["author@sciconnect.demo"]
        db.add(
            Paper(
                conference_id=conf.id,
                author_id=author.id,
                title="Применение нейросетей в анализе научных текстов",
                abstract="В работе рассматриваются методы NLP для классификации научных публикаций.",
                keywords=["NLP", "нейросети", "классификация"],
                status=PaperStatusEnum.DRAFT,
            )
        )
        db.add(
            Paper(
                conference_id=conf.id,
                author_id=author.id,
                title="Оптимизация запросов в распределённых СУБД",
                abstract="Предложен алгоритм оптимизации запросов для кластерных архитектур.",
                keywords=["СУБД", "оптимизация"],
                status=PaperStatusEnum.SUBMITTED,
            )
        )
        db.add(
            ConferenceSite(
                conference_id=conf.id,
                theme_json=_iccs2026_theme(conf.id),
                is_published=True,
                published_at=now,
            )
        )

        await db.commit()
        logger.info("Seed: демо-данные созданы")
        for email, pwd, _, _ in DEMO_USERS:
            logger.info("  %s / %s", email, pwd)
        return True


if __name__ == "__main__":
    import asyncio

    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_demo())
