"""add notification logs

Revision ID: 7e3a1b4c9f10
Revises: 2a2125e9de82
Create Date: 2026-02-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "7e3a1b4c9f10"
down_revision: Union[str, None] = "2a2125e9de82"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "notification_logs" not in existing_tables:
        op.create_table(
            "notification_logs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column("candidate_id", sa.Integer(), nullable=True),
            sa.Column("event", sa.String(), nullable=False),
            sa.Column("to_email", sa.String(), nullable=False),
            sa.Column("subject", sa.String(), nullable=False),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("status", sa.String(), nullable=False),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("payload", sa.JSON(), nullable=True),
            sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["candidate_id"], ["candidates.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    existing_indexes = {
        idx["name"] for idx in inspector.get_indexes("notification_logs")
    } if "notification_logs" in inspector.get_table_names() else set()

    if "ix_notification_logs_id" not in existing_indexes:
        op.create_index("ix_notification_logs_id", "notification_logs", ["id"], unique=False)
    if "ix_notification_logs_event" not in existing_indexes:
        op.create_index("ix_notification_logs_event", "notification_logs", ["event"], unique=False)
    if "ix_notification_logs_to_email" not in existing_indexes:
        op.create_index("ix_notification_logs_to_email", "notification_logs", ["to_email"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "notification_logs" not in inspector.get_table_names():
        return

    existing_indexes = {idx["name"] for idx in inspector.get_indexes("notification_logs")}
    if "ix_notification_logs_to_email" in existing_indexes:
        op.drop_index("ix_notification_logs_to_email", table_name="notification_logs")
    if "ix_notification_logs_event" in existing_indexes:
        op.drop_index("ix_notification_logs_event", table_name="notification_logs")
    if "ix_notification_logs_id" in existing_indexes:
        op.drop_index("ix_notification_logs_id", table_name="notification_logs")
    op.drop_table("notification_logs")
