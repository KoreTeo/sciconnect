"""platform extensions

Revision ID: 002
Revises: 001
Create Date: 2026-05-18

"""
from typing import Sequence, Union

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Platform extension tables/columns (paper_authors, registrations, payments, notification.link, etc.)
    # Production: run `alembic revision --autogenerate` against a migrated baseline.
    # Dev stack uses SQLAlchemy create_all + startup ALTER in app.main.
    pass


def downgrade() -> None:
    pass
