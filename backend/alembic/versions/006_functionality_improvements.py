"""payment purpose, pricing, review policy, tracks, roles

Revision ID: 006
Revises: 005
Create Date: 2026-05-19

"""
from typing import Sequence, Union

from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_STATEMENTS = (
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS purpose VARCHAR(50)",
    "ALTER TABLE conferences ADD COLUMN IF NOT EXISTS early_bird_fee NUMERIC(10,2)",
    "ALTER TABLE conferences ADD COLUMN IF NOT EXISTS early_bird_deadline TIMESTAMP WITH TIME ZONE",
    "ALTER TABLE conferences ADD COLUMN IF NOT EXISTS review_mode VARCHAR(20) DEFAULT 'open'",
    """
    CREATE TABLE IF NOT EXISTS conference_promo_codes (
        id SERIAL PRIMARY KEY,
        conference_id INTEGER NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
        code VARCHAR(50) NOT NULL,
        discount_percent NUMERIC(5,2) DEFAULT 0,
        discount_fixed NUMERIC(10,2) DEFAULT 0,
        max_uses INTEGER,
        used_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE,
        UNIQUE (conference_id, code)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS conference_tracks (
        id SERIAL PRIMARY KEY,
        conference_id INTEGER NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(80) NOT NULL,
        description TEXT,
        UNIQUE (conference_id, slug)
    )
    """,
    "ALTER TABLE papers ADD COLUMN IF NOT EXISTS track_id INTEGER REFERENCES conference_tracks(id)",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS conflict_declared BOOLEAN DEFAULT FALSE",
    """
    CREATE TABLE IF NOT EXISTS conference_roles (
        id SERIAL PRIMARY KEY,
        conference_id INTEGER NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(30) NOT NULL,
        track_id INTEGER REFERENCES conference_tracks(id),
        UNIQUE (conference_id, user_id, role, track_id)
    )
    """,
)


def upgrade() -> None:
    for stmt in _STATEMENTS:
        op.execute(stmt)


def downgrade() -> None:
    pass
