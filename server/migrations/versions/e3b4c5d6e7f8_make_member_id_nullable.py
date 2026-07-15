"""Make member_id nullable on attendance_records and attendance_sessions

Revision ID: e3b4c5d6e7f8
Revises: e2f3a4b5c6d7
Create Date: 2026-07-15 10:22:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "e3b4c5d6e7f8"
down_revision: Union[str, Sequence[str], None] = "e2f3a4b5c6d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use batch_alter_table for SQLite compatibility
    with op.batch_alter_table("attendance_records", schema=None) as batch_op:
        batch_op.alter_column(
            "member_id",
            existing_type=sa.String(),
            nullable=True,
        )

    with op.batch_alter_table("attendance_sessions", schema=None) as batch_op:
        batch_op.alter_column(
            "member_id",
            existing_type=sa.String(),
            nullable=True,
        )


def downgrade() -> None:
    # SQLite batch alter table downgrade
    with op.batch_alter_table("attendance_records", schema=None) as batch_op:
        batch_op.alter_column(
            "member_id",
            existing_type=sa.String(),
            nullable=False,
        )

    with op.batch_alter_table("attendance_sessions", schema=None) as batch_op:
        batch_op.alter_column(
            "member_id",
            existing_type=sa.String(),
            nullable=False,
        )
