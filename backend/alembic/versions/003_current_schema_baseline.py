"""current schema baseline

Revision ID: 003
Revises: 002
Create Date: 2026-05-18

"""
from typing import Sequence, Union

from alembic import op

from database import Base
import models  # noqa: F401

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Создаёт все таблицы на чистой БД; idempotent на уже существующей схеме."""
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
