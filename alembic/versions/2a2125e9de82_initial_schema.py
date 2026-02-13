"""initial schema

Revision ID: 2a2125e9de82
Revises: 
Create Date: 2026-02-04 15:26:55.730007

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a2125e9de82'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('role', sa.Enum('admin', 'recruiter', 'manager', 'hod', 'candidate', name='userrole'), nullable=True),
        sa.Column('status', sa.Enum('active', 'inactive', 'suspended', name='userstatus'), nullable=True),
        sa.Column('employee_code', sa.String(), nullable=True),
        sa.Column('manager_id', sa.Integer(), nullable=True),
        sa.Column('hod_id', sa.Integer(), nullable=True),
        sa.Column('department', sa.String(), nullable=True),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('employee_code')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    
    # Create candidates table
    op.create_table('candidates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(), nullable=True),
        sa.Column('country', sa.String(), nullable=True),
        sa.Column('skills', sa.JSON(), nullable=True),
        sa.Column('experience_years', sa.Integer(), nullable=True),
        sa.Column('current_company', sa.String(), nullable=True),
        sa.Column('current_position', sa.String(), nullable=True),
        sa.Column('expected_ctc', sa.Integer(), nullable=True),
        sa.Column('notice_period', sa.Integer(), nullable=True),
        sa.Column('resume_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_candidates_id'), 'candidates', ['id'], unique=False)
    
    # Create jobs table
    op.create_table('jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('department', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('job_type', sa.String(), nullable=True),
        sa.Column('experience_required', sa.Integer(), nullable=True),
        sa.Column('budget_min', sa.Float(), nullable=True),
        sa.Column('budget_max', sa.Float(), nullable=True),
        sa.Column('manager_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('visibility', sa.String(), nullable=True),
        sa.Column('skills_required', sa.JSON(), nullable=True),
        sa.Column('responsibilities', sa.Text(), nullable=True),
        sa.Column('requirements', sa.Text(), nullable=True),
        sa.Column('posted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['manager_id'], ['users.id'], )
    )
    op.create_index(op.f('ix_jobs_id'), 'jobs', ['id'], unique=False)
    
    # Create mprs table
    op.create_table('mprs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('requisition_code', sa.String(), nullable=False),
        sa.Column('job_title', sa.String(), nullable=False),
        sa.Column('job_description', sa.Text(), nullable=False),
        sa.Column('department', sa.String(), nullable=False),
        sa.Column('hiring_manager_id', sa.Integer(), nullable=False),
        sa.Column('hod_id', sa.Integer(), nullable=True),
        sa.Column('job_type', sa.String(), nullable=False),
        sa.Column('positions_requested', sa.Integer(), nullable=True),
        sa.Column('positions_approved', sa.Integer(), nullable=True),
        sa.Column('budget_min', sa.Float(), nullable=False),
        sa.Column('budget_max', sa.Float(), nullable=False),
        sa.Column('experience_required', sa.Integer(), nullable=True),
        sa.Column('skills_required', sa.JSON(), nullable=True),
        sa.Column('justification', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('pipeline_stats', sa.JSON(), nullable=True),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('requisition_code'),
        sa.ForeignKeyConstraint(['hiring_manager_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['hod_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], )
    )
    op.create_index(op.f('ix_mprs_id'), 'mprs', ['id'], unique=False)
    op.create_index(op.f('ix_mprs_requisition_code'), 'mprs', ['requisition_code'], unique=True)
    
    # Create agencies table
    op.create_table('agencies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('tier', sa.Enum('tier_1', 'tier_2', 'tier_3', name='agencytier'), nullable=True),
        sa.Column('status', sa.Enum('active', 'inactive', 'blacklisted', 'pending', name='agencystatus'), nullable=True),
        sa.Column('headquarters', sa.String(), nullable=True),
        sa.Column('agency_type', sa.String(), nullable=True),
        sa.Column('structure', sa.String(), nullable=True),
        sa.Column('spoc_name', sa.String(), nullable=False),
        sa.Column('spoc_email', sa.String(), nullable=False),
        sa.Column('spoc_phone', sa.String(), nullable=False),
        sa.Column('sla_days', sa.Integer(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('website', sa.String(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_agencies_id'), 'agencies', ['id'], unique=False)
    op.create_index(op.f('ix_agencies_name'), 'agencies', ['name'], unique=True)
    
    # Create remaining tables (simplified for brevity)
    op.create_table('candidate_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('candidate_id', sa.Integer(), nullable=False),
        sa.Column('document_type', sa.String(), nullable=False),
        sa.Column('document_url', sa.String(), nullable=False),
        sa.Column('file_name', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('verified', sa.Boolean(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], )
    )
    
    op.create_table('candidate_applications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('candidate_id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('application_data', sa.JSON(), nullable=True),
        sa.Column('ai_score', sa.Integer(), nullable=True),
        sa.Column('screening_notes', sa.Text(), nullable=True),
        sa.Column('applied_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], )
    )
    
    op.create_table('job_requisitions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('mpr_id', sa.Integer(), nullable=True),
        sa.Column('recruiter_id', sa.Integer(), nullable=True),
        sa.Column('target_hiring_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('priority', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ),
        sa.ForeignKeyConstraint(['mpr_id'], ['mprs.id'], ),
        sa.ForeignKeyConstraint(['recruiter_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], )
    )
    
    op.create_table('mpr_config',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('freeze', sa.Boolean(), nullable=True),
        sa.Column('strict_vetting', sa.Boolean(), nullable=True),
        sa.Column('ai_score_threshold', sa.Integer(), nullable=True),
        sa.Column('budget_tolerance_percent', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], )
    )
    
    op.create_table('agency_submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agency_id', sa.Integer(), nullable=False),
        sa.Column('mpr_id', sa.Integer(), nullable=True),
        sa.Column('job_id', sa.Integer(), nullable=True),
        sa.Column('candidate_name', sa.String(), nullable=False),
        sa.Column('candidate_email', sa.String(), nullable=False),
        sa.Column('candidate_phone', sa.String(), nullable=True),
        sa.Column('candidate_resume_url', sa.String(), nullable=False),
        sa.Column('submission_status', sa.String(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['agency_id'], ['agencies.id'], ),
        sa.ForeignKeyConstraint(['mpr_id'], ['mprs.id'], ),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], )
    )
    
    op.create_table('interviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('candidate_id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=True),
        sa.Column('round', sa.Enum('screening', 'technical_1', 'technical_2', 'managerial', 'hr', 'final', name='interviewround'), nullable=False),
        sa.Column('scheduled_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('mode', sa.Enum('in_person', 'video_call', 'phone_call', name='interviewmode'), nullable=True),
        sa.Column('status', sa.Enum('scheduled', 'completed', 'cancelled', 'no_show', name='interviewstatus'), nullable=True),
        sa.Column('meeting_link', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('panel_members', sa.JSON(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], )
    )
    
    op.create_table('interview_evaluations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('interview_id', sa.Integer(), nullable=False),
        sa.Column('candidate_id', sa.Integer(), nullable=False),
        sa.Column('evaluator_id', sa.Integer(), nullable=False),
        sa.Column('technical_rating', sa.Integer(), nullable=True),
        sa.Column('communication_rating', sa.Integer(), nullable=True),
        sa.Column('cultural_fit_rating', sa.Integer(), nullable=True),
        sa.Column('overall_rating', sa.Integer(), nullable=False),
        sa.Column('strengths', sa.Text(), nullable=True),
        sa.Column('weaknesses', sa.Text(), nullable=True),
        sa.Column('outcome', sa.String(), nullable=False),
        sa.Column('recommendation', sa.String(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('interview_id'),
        sa.ForeignKeyConstraint(['interview_id'], ['interviews.id'], ),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ),
        sa.ForeignKeyConstraint(['evaluator_id'], ['users.id'], )
    )
    
    op.create_table('offers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('candidate_id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('mpr_id', sa.Integer(), nullable=True),
        sa.Column('offer_code', sa.String(), nullable=False),
        sa.Column('ctc_fixed', sa.Float(), nullable=False),
        sa.Column('ctc_variable', sa.Float(), nullable=True),
        sa.Column('ctc_total', sa.Float(), nullable=False),
        sa.Column('joining_bonus', sa.Float(), nullable=True),
        sa.Column('relocation_bonus', sa.Float(), nullable=True),
        sa.Column('other_benefits', sa.JSON(), nullable=True),
        sa.Column('date_of_joining', sa.DateTime(timezone=True), nullable=False),
        sa.Column('offer_validity_days', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('draft', 'offered', 'accepted', 'declined', 'withdrawn', 'expired', 'joined', name='offerstatus'), nullable=True),
        sa.Column('offered_by', sa.Integer(), nullable=False),
        sa.Column('offered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('joining_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('variance_percent', sa.Float(), nullable=True),
        sa.Column('requires_approval', sa.Boolean(), nullable=True),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('offer_code'),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ),
        sa.ForeignKeyConstraint(['mpr_id'], ['mprs.id'], ),
        sa.ForeignKeyConstraint(['offered_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], )
    )
    op.create_index(op.f('ix_offers_offer_code'), 'offers', ['offer_code'], unique=True)
    
    op.create_table('blacklist',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('risk_level', sa.Enum('low', 'medium', 'high', 'critical', name='risklevel'), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('blacklisted_by', sa.Integer(), nullable=False),
        sa.Column('blacklisted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('removed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('removed_by', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.ForeignKeyConstraint(['blacklisted_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['removed_by'], ['users.id'], )
    )
    op.create_index(op.f('ix_blacklist_email'), 'blacklist', ['email'], unique=True)
    op.create_index(op.f('ix_blacklist_id'), 'blacklist', ['id'], unique=False)
    op.create_index(op.f('ix_blacklist_name'), 'blacklist', ['name'], unique=False)


def downgrade() -> None:
    # Drop all tables in reverse order
    op.drop_index(op.f('ix_blacklist_name'), table_name='blacklist')
    op.drop_index(op.f('ix_blacklist_id'), table_name='blacklist')
    op.drop_index(op.f('ix_blacklist_email'), table_name='blacklist')
    op.drop_table('blacklist')
    
    op.drop_index(op.f('ix_offers_offer_code'), table_name='offers')
    op.drop_table('offers')
    
    op.drop_table('interview_evaluations')
    op.drop_table('interviews')
    
    op.drop_table('agency_submissions')
    op.drop_table('mpr_config')
    op.drop_table('job_requisitions')
    op.drop_table('candidate_applications')
    op.drop_table('candidate_documents')
    
    op.drop_index(op.f('ix_agencies_name'), table_name='agencies')
    op.drop_index(op.f('ix_agencies_id'), table_name='agencies')
    op.drop_table('agencies')
    
    op.drop_index(op.f('ix_mprs_requisition_code'), table_name='mprs')
    op.drop_index(op.f('ix_mprs_id'), table_name='mprs')
    op.drop_table('mprs')
    
    op.drop_index(op.f('ix_jobs_id'), table_name='jobs')
    op.drop_table('jobs')
    
    op.drop_index(op.f('ix_candidates_id'), table_name='candidates')
    op.drop_table('candidates')
    
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    
    # Drop custom types
    op.execute('DROP TYPE userrole')
    op.execute('DROP TYPE userstatus')
    op.execute('DROP TYPE agencytier')
    op.execute('DROP TYPE agencystatus')
    op.execute('DROP TYPE interviewround')
    op.execute('DROP TYPE interviewmode')
    op.execute('DROP TYPE interviewstatus')
    op.execute('DROP TYPE offerstatus')
    op.execute('DROP TYPE risklevel')