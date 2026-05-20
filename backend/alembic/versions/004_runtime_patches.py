"""runtime schema patches (formerly init_db ALTER/indexes)

Revision ID: 004
Revises: 003
Create Date: 2026-05-19

"""
from typing import Sequence, Union

from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_ENUM_PATCHES = (
    "ALTER TYPE conferencestatusenum ADD VALUE IF NOT EXISTS 'pending_approval'",
    "ALTER TYPE conferencestatusenum ADD VALUE IF NOT EXISTS 'rejected'",
    "ALTER TYPE conferencestatusenum ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL'",
    "ALTER TYPE conferencestatusenum ADD VALUE IF NOT EXISTS 'REJECTED'",
)

_COLUMN_PATCHES = (
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS orcid VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb",
    "ALTER TABLE paper_authors ADD COLUMN IF NOT EXISTS orcid VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(255)",
    "ALTER TABLE papers ALTER COLUMN submitted_at DROP NOT NULL",
    "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(500)",
    "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50)",
    "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id INTEGER",
    "ALTER TABLE conferences ADD COLUMN IF NOT EXISTS registration_fee NUMERIC(10,2) DEFAULT 0",
    "ALTER TABLE conferences ADD COLUMN IF NOT EXISTS submission_fee NUMERIC(10,2) DEFAULT 0",
    "ALTER TABLE conferences ADD COLUMN IF NOT EXISTS fee_required BOOLEAN DEFAULT FALSE",
    "ALTER TABLE conferences ADD COLUMN IF NOT EXISTS moderation_comment TEXT",
    "ALTER TABLE conferences ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id)",
    "ALTER TABLE conferences ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE",
)

_INDEX_PATCHES = (
    "CREATE INDEX IF NOT EXISTS ix_conferences_status_start_date ON conferences (status, start_date)",
    "CREATE INDEX IF NOT EXISTS ix_conferences_organizer_id ON conferences (organizer_id)",
    "CREATE INDEX IF NOT EXISTS ix_papers_author_id_id ON papers (author_id, id)",
    "CREATE INDEX IF NOT EXISTS ix_papers_conference_id_status ON papers (conference_id, status)",
    "CREATE INDEX IF NOT EXISTS ix_papers_conference_id_id ON papers (conference_id, id)",
    "CREATE INDEX IF NOT EXISTS ix_reviews_reviewer_id_submitted_at ON reviews (reviewer_id, submitted_at)",
    "CREATE INDEX IF NOT EXISTS ix_reviews_paper_id ON reviews (paper_id)",
    "CREATE INDEX IF NOT EXISTS ix_notifications_user_read_created ON notifications (user_id, is_read, created_at)",
    "CREATE INDEX IF NOT EXISTS ix_paper_versions_paper_id_version_number ON paper_versions (paper_id, version_number)",
    "CREATE INDEX IF NOT EXISTS ix_paper_revision_requests_lookup ON paper_revision_requests (paper_id, resolved_at, round_number)",
    "CREATE INDEX IF NOT EXISTS ix_admin_audit_logs_created_at ON admin_audit_logs (created_at)",
    "CREATE INDEX IF NOT EXISTS ix_admin_audit_logs_entity_type ON admin_audit_logs (entity_type)",
    "CREATE INDEX IF NOT EXISTS ix_admin_audit_logs_actor_id ON admin_audit_logs (actor_id)",
    "CREATE INDEX IF NOT EXISTS ix_payments_provider_external_id ON payments (provider, external_id)",
)


def upgrade() -> None:
    for stmt in _ENUM_PATCHES:
        op.execute(stmt)
    for stmt in _COLUMN_PATCHES:
        op.execute(stmt)
    for stmt in _INDEX_PATCHES:
        op.execute(stmt)


def downgrade() -> None:
    pass
