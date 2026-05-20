# SciConnect

Веб-платформа для автоматизации организации научных конференций.

## Стек

- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy async, PostgreSQL, Alembic
- **Infra:** Docker Compose (Postgres, Redis, Mailhog)

## Быстрый старт

```bash
docker compose up --build
```

- Frontend: <http://localhost:3000>
- API docs: <http://localhost:8000/docs>
- Mailhog UI: <http://localhost:8025>

### Seed-данные

Демо-данные создаются **автоматически** при старте backend. Если каталог пустой:

```bash
docker compose exec backend python seed_demo.py
```

### Регистрация

- **Участник:** <http://localhost:3000/register> — ФИО, email, пароль, организация (обяз.), страна (опц.), ORCID и телефон (опц.)
- **Организатор:** <http://localhost:3000/register/organizer> — отдельная форма с организацией и телефоном
- **На конференцию:** на публичном сайте `/c/[shortName]` — тип участия (слушатель/автор), согласие с [условиями](/terms), проверка профиля (email + организация)
- После регистрации аккаунта на email приходит ссылка подтверждения (`/verify-email?token=...`). Вход возможен без подтверждения; подача статей и регистрация на конференцию требуют `email_verified` (если включено в env).

### Email (dev и prod)

В dev письма перехватывает **Mailhog** (UI: <http://localhost:8025>, SMTP: `mailhog:1025` в Docker).

Переменные (см. [`.env.example`](.env.example)):

- `FRONTEND_URL` — базовый URL для ссылок в письмах (сброс пароля, подтверждение, уведомления).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` — SMTP-сервер.
- `EMAIL_VERIFICATION_REQUIRED` — `true`, чтобы блокировать подачу статей и регистрацию на конференцию без подтверждения email.

В `docker-compose.yaml` для E2E и демо по умолчанию `EMAIL_VERIFICATION_REQUIRED=false`. Для проверки политики верификации установите `true` в `.env` backend.

Транзакционные письма: подтверждение email, сброс пароля, назначение рецензента, решение по статье, подача/доработка, рецензия, модерация конференции — дублируют in-app уведомления.

### Email v2 (HTML + очередь)

Письма отправляются как **multipart HTML** (Jinja2-шаблоны в `backend/app/email_templates/`) с text/plain fallback.

- `EMAIL_ASYNC` — `true`, чтобы ставить письма в очередь ARQ (не блокирует API); `false` — синхронная отправка (pytest).
- `SMTP_FROM_NAME` — имя отправителя в заголовке From.

В Docker поднимается сервис **`email-worker`** (`arq worker.WorkerSettings`). Логи: `docker compose logs -f email-worker`.

Просмотр HTML в dev: <http://localhost:8025> (Mailhog -> вкладка HTML у письма).

```bash
docker compose up -d --build
# backend + email-worker + mailhog
```

### Демо-аккаунты

- `admin@sciconnect.demo` / `admin123` — admin
- `organizer@sciconnect.demo` / `org123456` — organizer
- `reviewer1@sciconnect.demo` / `rev123456` — reviewer
- `author@sciconnect.demo` / `user123456` — participant

Публичный сайт: <http://localhost:3000/c/iccs2026> (навигация: приглашение, программа, сборники, галерея и др.)

В конструкторе сайта (`/conference-site/[id]`) кнопка **«Применить шаблон»** создаёт типовой набор страниц академической конференции.

## Основные маршруты

- `/` — главная, CTA по ролям.
- `/conferences` — каталог с фильтрами.
- `/dashboard` — кабинет по роли.
- `/my-papers`, `/papers/[id]` — статьи автора, детали, рецензии.
- `/submit-paper?paperId=` — подача / редактирование / доработка.
- `/reviews`, `/reviews/[paperId]` — рецензирование.
- `/conference-manage/[id]` — статьи, рецензенты, решения.
- `/conferences/new`, `/conferences/[id]/edit` — создание и редактирование.
- `/conference-site/[id]` — конструктор сайта: страницы, WYSIWYG, галерея, сборники.
- `/conference-program/[id]` — редактор программы.
- `/c/[shortName]` — публичный сайт (главная).
- `/c/[shortName]/[slug]` — подстраницы (программа, галерея, сборники и т.д.).
- `/profile` — профиль, страна, смена пароля, уведомления.
- `/terms` — условия участия в конференциях.
- `/my-registrations` — регистрации пользователя на конференции.
- `/admin` — админ-панель.

## Демо-сценарий

1. **Гость** — каталог, публичный сайт `/c/iccs2026`
2. **Автор** — подача статьи, просмотр рецензий на `/papers/[id]`
3. **Организатор** — управление, пул рецензентов, конструктор сайта, программа
4. **Рецензент** — `/reviews`, PDF, форма рецензии
5. **Админ** — `/admin` — роли пользователей, статусы конференций

## Миграции (Alembic)

Схема Postgres управляется Alembic. При старте Docker backend выполняет `alembic upgrade head` перед uvicorn (см. [`backend/Dockerfile`](backend/Dockerfile)).

Локально или в CI:

```bash
cd backend
alembic upgrade head
python seed_demo.py   # опционально, демо-данные
```

- `003_current_schema_baseline.py` — baseline на чистой БД
- `004_runtime_patches.py` — idempotent patches (колонки, индексы, enum), ранее в `init_db()`
- `005_user_country.py` — `users.country` (ISO 3166-1 alpha-2) для MVP+ регистрации

SQLite (pytest) по-прежнему использует `create_all` в fixtures.

## Тестирование

Кратко:

```bash
cd frontend
npm run test:e2e:smoke:quick      # перед commit
npm run test:e2e:smoke:extended   # перед merge (alias: test:e2e:smoke)
npm run test:e2e                  # полный регресс перед релизом (без capture-screenshots)
npm run test:e2e:screenshots      # ручные скриншоты UI (локально)
```

Требуется `docker compose up`. Единый прогон backend + typecheck + build: `.\scripts\refactor-check.ps1` (опционально `-WithSmokeQuick` / `-WithSmokeExtended`).

### Ручной smoke (расширенный)

**Manage** — вкладки overview / participants / papers / reviewers; экспорт CSV; назначение рецензента; bulk revision; пул рецензентов.

**Site** — шаблон; блоки text, image, gallery, proceedings, venue, cta; preview; publish / unpublish.

**Admin** — модерация (принять / доработка / отклонить); пользователи (роль, блокировка); конференции (статус); журнал аудита.

**Submit / papers / program** — autosave черновика; withdraw / delete; программа с accepted paper.

**Backend** — `GET .../export` отдаёт CSV через `csv_export.py`.

## Структура проекта

- **Backend CSV:** `backend/app/services/csv_export.py` — общий `csv_streaming_response` для экспортов papers/reviews/registrations/proceedings.
- **Backend schemas:** пакет `backend/app/schemas/` (`users`, `conferences`, `papers`, `reviews`, …) с единой точкой импорта в `schemas/__init__.py`.
- **Backend reviews:** enriched `ReviewResponse` + `GET /reviews/my?paper_id=` — см. `backend/app/services/review_queries.py`.
- **Управление конференцией:** `frontend/components/conferences/manage/` — вкладки + `ManagePaperCard`, filters; state в `frontend/hooks/useManageConferenceState.ts`; мутации в `frontend/hooks/useConferenceManageMutations.ts`.
- **Подача статьи:** `frontend/hooks/useSubmitPaperFlow.ts`, `frontend/components/papers/SubmitPaperForm.tsx`, `PaperFileUpload.tsx`.
- **Сборник:** `frontend/components/proceedings/`, `frontend/hooks/useProceedingsEditor.ts`.
- **Конструктор сайта:** `frontend/components/site/editor/` — `BlockEditorPanel`, блоки gallery/proceedings; `frontend/hooks/useSiteEditorMutations.ts`, `useSiteEditorActions.ts`.
- **Shared hooks:** `useUserSearch`, `UserSearchField`, `useResendVerification`, `useProfileMutations`, `ConfirmDialog` / `useConfirm`.
- **Модули валидации и типов:** `frontend/lib/validation/` (auth, profile, conference, paper, …), `frontend/lib/types/` (entities, site, admin, labels) — импорт через `@/lib/validation`, `@/lib/types`.
- **Batch revision:** `POST /conferences/{id}/papers/bulk-request-revision` + `useBulkRequestPaperRevision`.
- **Админка:** `frontend/components/admin/` — секции с lazy queries по вкладкам.
- **Загрузки и экспорт:** `frontend/lib/download.ts`, `frontend/lib/queries/exports.ts`.

## Backend Tests

```bash
cd backend
pytest -q   # ~47 tests
python -m compileall app
```
