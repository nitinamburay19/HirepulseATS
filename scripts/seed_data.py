"""
Seed database with sample data for testing
"""
import sys
import os
from datetime import datetime, timedelta
import random
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole, UserStatus
from app.models.candidate import Candidate
from app.models.job import Job, JobStatus
from app.models.mpr import MPR, MPRStatus
from app.models.agency import Agency, AgencyStatus, AgencyTier
from app.models.interview import Interview, InterviewRound, InterviewMode, InterviewStatus
from app.models.offer import Offer, OfferStatus

def seed_sample_data() -> None:
    """Seed database with sample data"""
    print("Seeding sample data...")
    
    db = SessionLocal()
    try:
        # Clear existing data (optional - be careful in production!)
        # db.query(Offer).delete()
        # db.query(Interview).delete()
        # db.query(Agency).delete()
        # db.query(MPR).delete()
        # db.query(Job).delete()
        # db.query(Candidate).delete()
        # db.query(User).delete()
        
        # Create sample users
        users = []
        
        # Admin
        admin = User(
            email="admin@hirepulse.com",
            password_hash=get_password_hash("Admin@123"),
            name="System Administrator",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            last_login=datetime.utcnow()
        )
        users.append(admin)
        
        # Recruiters
        recruiter1 = User(
            email="recruiter1@hirepulse.com",
            password_hash=get_password_hash("Recruiter@123"),
            name="Sarah Johnson",
            role=UserRole.RECRUITER,
            status=UserStatus.ACTIVE,
            department="HR",
            last_login=datetime.utcnow() - timedelta(days=1)
        )
        users.append(recruiter1)
        
        recruiter2 = User(
            email="recruiter2@hirepulse.com",
            password_hash=get_password_hash("Recruiter@123"),
            name="Mike Chen",
            role=UserRole.RECRUITER,
            status=UserStatus.ACTIVE,
            department="HR",
            last_login=datetime.utcnow() - timedelta(days=2)
        )
        users.append(recruiter2)
        
        # Managers
        manager1 = User(
            email="manager1@hirepulse.com",
            password_hash=get_password_hash("Manager@123"),
            name="David Wilson",
            role=UserRole.MANAGER,
            status=UserStatus.ACTIVE,
            department="Engineering",
            last_login=datetime.utcnow() - timedelta(days=3)
        )
        users.append(manager1)
        
        manager2 = User(
            email="manager2@hirepulse.com",
            password_hash=get_password_hash("Manager@123"),
            name="Lisa Rodriguez",
            role=UserRole.MANAGER,
            status=UserStatus.ACTIVE,
            department="Product",
            last_login=datetime.utcnow() - timedelta(days=1)
        )
        users.append(manager2)
        
        # Candidates
        candidate1 = User(
            email="candidate1@example.com",
            password_hash=get_password_hash("Candidate@123"),
            name="John Smith",
            role=UserRole.CANDIDATE,
            status=UserStatus.ACTIVE,
            last_login=datetime.utcnow() - timedelta(days=5)
        )
        users.append(candidate1)
        
        candidate2 = User(
            email="candidate2@example.com",
            password_hash=get_password_hash("Candidate@123"),
            name="Emma Watson",
            role=UserRole.CANDIDATE,
            status=UserStatus.ACTIVE,
            last_login=datetime.utcnow() - timedelta(days=2)
        )
        users.append(candidate2)
        
        # Add all users
        for user in users:
            db.add(user)
        
        db.commit()
        db.refresh(admin)
        db.refresh(recruiter1)
        db.refresh(recruiter2)
        db.refresh(manager1)
        db.refresh(manager2)
        db.refresh(candidate1)
        db.refresh(candidate2)
        
        # Create candidate profiles
        candidate_profile1 = Candidate(
            user_id=candidate1.id,
            phone="+1234567890",
            city="New York",
            country="USA",
            skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
            experience_years=5,
            current_company="TechCorp",
            current_position="Senior Developer",
            expected_ctc=120000,
            notice_period=30
        )
        db.add(candidate_profile1)
        
        candidate_profile2 = Candidate(
            user_id=candidate2.id,
            phone="+1987654321",
            city="San Francisco",
            country="USA",
            skills=["React", "JavaScript", "TypeScript", "Node.js"],
            experience_years=3,
            current_company="StartupXYZ",
            current_position="Frontend Developer",
            expected_ctc=90000,
            notice_period=60
        )
        db.add(candidate_profile2)
        
        # Create jobs
        job1 = Job(
            title="Senior Backend Developer",
            description="Develop and maintain backend services using Python and FastAPI",
            department="Engineering",
            location="Remote",
            job_type="full-time",
            experience_required=5,
            budget_min=100000,
            budget_max=140000,
            manager_id=manager1.id,
            status=JobStatus.OPEN,
            visibility="public",
            skills_required=["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"],
            posted_at=datetime.utcnow() - timedelta(days=30)
        )
        db.add(job1)
        
        job2 = Job(
            title="Frontend Developer",
            description="Build responsive web applications using React and TypeScript",
            department="Engineering",
            location="New York",
            job_type="full-time",
            experience_required=3,
            budget_min=80000,
            budget_max=100000,
            manager_id=manager1.id,
            status=JobStatus.OPEN,
            visibility="public",
            skills_required=["React", "TypeScript", "JavaScript", "HTML", "CSS"],
            posted_at=datetime.utcnow() - timedelta(days=15)
        )
        db.add(job2)
        
        job3 = Job(
            title="Product Manager",
            description="Lead product development from conception to launch",
            department="Product",
            location="San Francisco",
            job_type="full-time",
            experience_required=7,
            budget_min=130000,
            budget_max=160000,
            manager_id=manager2.id,
            status=JobStatus.OPEN,
            visibility="internal",
            skills_required=["Product Management", "Agile", "User Research", "Analytics"],
            posted_at=datetime.utcnow() - timedelta(days=10)
        )
        db.add(job3)
        
        db.commit()
        db.refresh(job1)
        db.refresh(job2)
        db.refresh(job3)
        
        # Create MPRs
        mpr1 = MPR(
            requisition_code="MPR-2024-001",
            job_title="Senior Backend Developer",
            job_description="Need senior developer for new microservices project",
            department="Engineering",
            hiring_manager_id=manager1.id,
            job_type="permanent",
            positions_requested=2,
            positions_approved=2,
            budget_min=100000,
            budget_max=140000,
            experience_required=5,
            skills_required=["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"],
            status=MPRStatus.ACTIVE,
            pipeline_stats={
                "profilesReceived": 15,
                "shortlisted": 8,
                "interviewed": 5,
                "offered": 2,
                "hired": 1
            },
            created_at=datetime.utcnow() - timedelta(days=45)
        )
        db.add(mpr1)
        
        mpr2 = MPR(
            requisition_code="MPR-2024-002",
            job_title="Frontend Developer",
            job_description="Frontend developer for customer portal redesign",
            department="Engineering",
            hiring_manager_id=manager1.id,
            job_type="permanent",
            positions_requested=1,
            positions_approved=1,
            budget_min=80000,
            budget_max=100000,
            experience_required=3,
            skills_required=["React", "TypeScript", "JavaScript", "HTML", "CSS"],
            status=MPRStatus.ACTIVE,
            pipeline_stats={
                "profilesReceived": 10,
                "shortlisted": 6,
                "interviewed": 4,
                "offered": 1,
                "hired": 0
            },
            created_at=datetime.utcnow() - timedelta(days=30)
        )
        db.add(mpr2)
        
        # Create agencies
        agency1 = Agency(
            name="TechRecruit Pro",
            tier=AgencyTier.TIER_1,
            status=AgencyStatus.ACTIVE,
            headquarters="New York",
            agency_type="specialized",
            structure="domestic",
            spoc_name="Robert Brown",
            spoc_email="robert@techrecruit.com",
            spoc_phone="+1234567890",
            sla_days=30,
            location="Multiple",
            website="https://techrecruit.com",
            notes="Premium partner for tech roles"
        )
        db.add(agency1)
        
        agency2 = Agency(
            name="Global Talent Solutions",
            tier=AgencyTier.TIER_2,
            status=AgencyStatus.ACTIVE,
            headquarters="London",
            agency_type="general",
            structure="international",
            spoc_name="Sarah Miller",
            spoc_email="sarah@globaltalent.com",
            spoc_phone="+441234567890",
            sla_days=45,
            location="Worldwide",
            website="https://globaltalent.com",
            notes="Good for international hires"
        )
        db.add(agency2)
        
        db.commit()
        db.refresh(mpr1)
        db.refresh(mpr2)
        db.refresh(agency1)
        db.refresh(agency2)
        
        # Create interviews
        interview1 = Interview(
            candidate_id=candidate_profile1.id,
            job_id=job1.id,
            round=InterviewRound.TECHNICAL_1,
            scheduled_time=datetime.utcnow() + timedelta(days=2),
            duration_minutes=60,
            mode=InterviewMode.VIDEO_CALL,
            status=InterviewStatus.SCHEDULED,
            meeting_link="https://meet.example.com/interview-001",
            panel_members=[manager1.id, recruiter1.id],
            created_by=recruiter1.id
        )
        db.add(interview1)
        
        interview2 = Interview(
            candidate_id=candidate_profile2.id,
            job_id=job2.id,
            round=InterviewRound.TECHNICAL_1,
            scheduled_time=datetime.utcnow() + timedelta(days=3),
            duration_minutes=45,
            mode=InterviewMode.VIDEO_CALL,
            status=InterviewStatus.SCHEDULED,
            meeting_link="https://meet.example.com/interview-002",
            panel_members=[manager1.id],
            created_by=recruiter2.id
        )
        db.add(interview2)
        
        # Create offers
        offer1 = Offer(
            candidate_id=candidate_profile1.id,
            job_id=job1.id,
            mpr_id=mpr1.id,
            offer_code="OFFER-2024-001",
            ctc_fixed=120000,
            ctc_variable=10000,
            ctc_total=130000,
            joining_bonus=5000,
            date_of_joining=datetime.utcnow() + timedelta(days=30),
            offer_validity_days=15,
            status=OfferStatus.OFFERED,
            offered_by=recruiter1.id,
            offered_at=datetime.utcnow() - timedelta(days=5),
            variance_percent=7.14,  # (130000-140000)/140000 * 100
            requires_approval=False
        )
        db.add(offer1)
        
        offer2 = Offer(
            candidate_id=candidate_profile2.id,
            job_id=job2.id,
            mpr_id=mpr2.id,
            offer_code="OFFER-2024-002",
            ctc_fixed=85000,
            ctc_variable=5000,
            ctc_total=90000,
            date_of_joining=datetime.utcnow() + timedelta(days=45),
            offer_validity_days=15,
            status=OfferStatus.ACCEPTED,
            offered_by=recruiter2.id,
            offered_at=datetime.utcnow() - timedelta(days=10),
            accepted_at=datetime.utcnow() - timedelta(days=5),
            variance_percent=10.0,  # (90000-100000)/100000 * 100
            requires_approval=True
        )
        db.add(offer2)
        
        db.commit()
        
        print("Sample data seeded successfully!")
        print("\nSample User Credentials:")
        print("Admin: admin@hirepulse.com / Admin@123")
        print("Recruiter: recruiter1@hirepulse.com / Recruiter@123")
        print("Manager: manager1@hirepulse.com / Manager@123")
        print("Candidate: candidate1@example.com / Candidate@123")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_sample_data()