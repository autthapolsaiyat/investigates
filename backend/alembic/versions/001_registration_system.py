"""Add registration_requests and user_sessions tables, update users

Revision ID: 001_registration_system
Revises: 
Create Date: 2026-01-18

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_registration_system'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to users table
    op.add_column('users', sa.Column('position', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('organization_name', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('status', sa.String(20), nullable=True, server_default='active'))
    op.add_column('users', sa.Column('subscription_start', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('subscription_end', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('approved_by', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('approved_at', sa.DateTime(), nullable=True))
    
    # Create registration_requests table
    op.create_table(
        'registration_requests',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('email', sa.String(255), unique=True, index=True, nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('organization_name', sa.String(255), nullable=True),
        sa.Column('position', sa.String(100), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('processed_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('subscription_days', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create user_sessions table
    op.create_table(
        'user_sessions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('session_token', sa.String(255), unique=True, index=True, nullable=False),
        sa.Column('device_id', sa.String(255), nullable=True),
        sa.Column('device_info', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(50), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('last_active_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('expired_at', sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    # Drop tables
    op.drop_table('user_sessions')
    op.drop_table('registration_requests')
    
    # Remove columns from users
    op.drop_column('users', 'approved_at')
    op.drop_column('users', 'approved_by')
    op.drop_column('users', 'subscription_end')
    op.drop_column('users', 'subscription_start')
    op.drop_column('users', 'status')
    op.drop_column('users', 'organization_name')
    op.drop_column('users', 'position')
