"""add users table

Revision ID: b1c2d3e4f5a6
Revises: a2b3c4d5e6f7
Create Date: 2026-07-21 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, None] = 'a2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        # From BaseModel
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),

        # User-specific columns
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='SALES_EXECUTIVE'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('bio', sa.String(1000), nullable=True),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),

        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')