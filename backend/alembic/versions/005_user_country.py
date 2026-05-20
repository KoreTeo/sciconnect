"""add users.country (ISO 3166-1 alpha-2)

Revision ID: 005
Revises: 004
Create Date: 2026-05-19

"""
from typing import Sequence, Union

from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(2)")


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS country")
