"""
CRUD operations for Job models
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime
from app.models.job import Job, JobRequisition, JobStatus
from app.models.candidate import CandidateApplication
from app.models.interview import Interview, InterviewEvaluation
from app.models.offer import Offer
from app.schemas.job import JobCreate, JobUpdate, JobRequisitionCreate

class CRUDJob:
    # Job operations
    def get_job(self, db: Session, job_id: int) -> Optional[Job]:
        """Get job by ID"""
        return db.query(Job).filter(Job.id == job_id).first()
    
    def get_all_jobs(self, db: Session, skip: int = 0, limit: int = 100) -> List[Job]:
        """Get all jobs"""
        return db.query(Job).offset(skip).limit(limit).all()
    
    def get_public_jobs(self, db: Session, skip: int = 0, limit: int = 100) -> List[Job]:
        """Get public/open jobs"""
        return db.query(Job).filter(
            func.lower(Job.visibility) == "public",
            func.lower(Job.status) == JobStatus.OPEN.value
        ).order_by(Job.posted_at.desc().nullslast(), Job.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_jobs_by_manager(self, db: Session, manager_id: int) -> List[Job]:
        """Get jobs by manager"""
        return db.query(Job).filter(Job.manager_id == manager_id).all()
    
    def create_job(self, db: Session, job_in: JobCreate) -> Job:
        """Create a job"""
        payload = job_in.dict()
        # Recruiter posting should be immediately available for candidate discovery.
        payload["status"] = JobStatus.OPEN.value
        payload["posted_at"] = datetime.utcnow()
        db_job = Job(**payload)
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        return db_job

    def publish_draft_jobs(self, db: Session) -> int:
        """Publish all draft jobs (open + public + posted timestamp)"""
        updated = db.query(Job).filter(
            func.lower(Job.status) == JobStatus.DRAFT.value
        ).update(
            {
                Job.status: JobStatus.OPEN.value,
                Job.visibility: "public",
                Job.posted_at: func.coalesce(Job.posted_at, func.now()),
            },
            synchronize_session=False,
        )
        db.commit()
        return int(updated or 0)
    
    def update_job(self, db: Session, job_id: int, job_in: JobUpdate) -> Optional[Job]:
        """Update a job"""
        db_job = self.get_job(db, job_id)
        if not db_job:
            return None
        
        update_data = job_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_job, field, value)
        
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        return db_job
    
    def delete_job(self, db: Session, job_id: int) -> bool:
        """Delete a job"""
        db_job = self.get_job(db, job_id)
        if not db_job:
            return False

        # Remove dependent records first to satisfy FK constraints.
        interview_ids = [
            row[0] for row in db.query(Interview.id).filter(Interview.job_id == job_id).all()
        ]
        if interview_ids:
            db.query(InterviewEvaluation).filter(
                InterviewEvaluation.interview_id.in_(interview_ids)
            ).delete(synchronize_session=False)

        db.query(Offer).filter(Offer.job_id == job_id).delete(synchronize_session=False)
        db.query(Interview).filter(Interview.job_id == job_id).delete(synchronize_session=False)
        db.query(CandidateApplication).filter(
            CandidateApplication.job_id == job_id
        ).delete(synchronize_session=False)
        db.query(JobRequisition).filter(JobRequisition.job_id == job_id).delete(synchronize_session=False)

        db.delete(db_job)
        db.commit()
        return True
    
    # Job Requisition operations
    def get_requisition(self, db: Session, requisition_id: int) -> Optional[JobRequisition]:
        """Get job requisition by ID"""
        return db.query(JobRequisition).filter(JobRequisition.id == requisition_id).first()
    
    def get_all_requisitions(self, db: Session) -> List[JobRequisition]:
        """Get all job requisitions"""
        return db.query(JobRequisition).all()
    
    def create_requisition(self, db: Session, requisition_in: JobRequisitionCreate) -> JobRequisition:
        """Create a job requisition"""
        db_requisition = JobRequisition(**requisition_in.dict())
        db.add(db_requisition)
        db.commit()
        db.refresh(db_requisition)
        return db_requisition

crud_job = CRUDJob()
