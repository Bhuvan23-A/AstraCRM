"""Add CRM models

Revision ID: a2b3c4d5e6f7
Revises: None
Create Date: 2026-07-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a2b3c4d5e6f7'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create tags table
    op.create_table(
        'tags',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('color', sa.String(length=20), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tags_name'), 'tags', ['name'], unique=True)

    # 2. Create accounts table
    op.create_table(
        'accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('address_line1', sa.String(length=255), nullable=True),
        sa.Column('address_line2', sa.String(length=255), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('zip_code', sa.String(length=20), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('annual_revenue', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('employees_count', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accounts_name'), 'accounts', ['name'], unique=False)

    # 3. Create contacts table
    op.create_table(
        'contacts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('first_name', sa.String(length=150), nullable=False),
        sa.Column('last_name', sa.String(length=150), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('job_title', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_contacts_email'), 'contacts', ['email'], unique=False)
    op.create_index(op.f('ix_contacts_first_name'), 'contacts', ['first_name'], unique=False)
    op.create_index(op.f('ix_contacts_last_name'), 'contacts', ['last_name'], unique=False)

    # 4. Create leads table
    op.create_table(
        'leads',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('first_name', sa.String(length=150), nullable=False),
        sa.Column('last_name', sa.String(length=150), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('company_name', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('source', sa.String(length=100), nullable=True),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('converted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('converted_contact_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('converted_account_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['converted_account_id'], ['accounts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['converted_contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_leads_company_name'), 'leads', ['company_name'], unique=False)
    op.create_index(op.f('ix_leads_email'), 'leads', ['email'], unique=False)
    op.create_index(op.f('ix_leads_first_name'), 'leads', ['first_name'], unique=False)
    op.create_index(op.f('ix_leads_last_name'), 'leads', ['last_name'], unique=False)

    # 5. Create M2M association tables
    op.create_table(
        'account_tag',
        sa.Column('account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tag_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('account_id', 'tag_id')
    )

    op.create_table(
        'contact_tag',
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tag_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('contact_id', 'tag_id')
    )

    op.create_table(
        'lead_tag',
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tag_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('lead_id', 'tag_id')
    )


def downgrade() -> None:
    op.drop_table('lead_tag')
    op.drop_table('contact_tag')
    op.drop_table('account_tag')
    
    op.drop_index(op.f('ix_leads_last_name'), table_name='leads')
    op.drop_index(op.f('ix_leads_first_name'), table_name='leads')
    op.drop_index(op.f('ix_leads_email'), table_name='leads')
    op.drop_index(op.f('ix_leads_company_name'), table_name='leads')
    op.drop_table('leads')
    
    op.drop_index(op.f('ix_contacts_last_name'), table_name='contacts')
    op.drop_index(op.f('ix_contacts_first_name'), table_name='contacts')
    op.drop_index(op.f('ix_contacts_email'), table_name='contacts')
    op.drop_table('contacts')
    
    op.drop_index(op.f('ix_accounts_name'), table_name='accounts')
    op.drop_table('accounts')
    
    op.drop_index(op.f('ix_tags_name'), table_name='tags')
    op.drop_table('tags')
