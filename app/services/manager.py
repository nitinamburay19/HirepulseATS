"""
Manager dashboard service
"""
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from datetime import datetime
from app.crud.mpr import crud_mpr
from app.crud.interview import crud_interview
from app.crud.offer import crud_offer
from app.models.mpr import MPR
from app.models.interview import Interview
from app.models.job import Job
from app.models.candidate import CandidateApplication, CandidateDocument
from app.models.offer import Offer
from sqlalchemy import func, false, and_, or_
from sqlalchemy import cast, String

class ManagerService:
    def __init__(self, db: Session):
        self.db = db

    def _resolve_manager_jobs(self, manager_id: int) -> List[Job]:
        """Resolve jobs visible to a manager, including unlinked jobs that match manager MPRs."""
        manager_mprs = self.db.query(MPR).filter(MPR.hiring_manager_id == manager_id).all()
        direct_jobs = self.db.query(Job).filter(Job.manager_id == manager_id)

        if not manager_mprs:
            return direct_jobs.order_by(Job.created_at.desc()).all()

        mpr_match_conditions = []
        for mpr in manager_mprs:
            mpr_match_conditions.append(
                and_(
                    func.lower(Job.title) == func.lower(mpr.job_title),
                    func.lower(Job.department) == func.lower(mpr.department),
                )
            )
            mpr_match_conditions.append(
                func.lower(Job.title) == func.lower(mpr.job_title)
            )
            mpr_match_conditions.append(
                func.lower(Job.department) == func.lower(mpr.department)
            )

        return (
            self.db.query(Job)
            .filter(
                or_(
                    Job.manager_id == manager_id,
                    and_(
                        Job.manager_id.is_(None),
                        or_(*mpr_match_conditions),
                    ),
                )
            )
            .order_by(Job.created_at.desc())
            .all()
        )

    def get_manager_interviews(self, manager_id: int) -> List[Interview]:
        """Get interviews visible to manager from panel assignments or manager-linked jobs."""
        panel_assigned = self.db.query(Interview).filter(
            cast(Interview.panel_members, String).like(f"%{manager_id}%")
        ).all()
        if panel_assigned:
            return panel_assigned

        manager_jobs = self._resolve_manager_jobs(manager_id)
        manager_job_ids = [job.id for job in manager_jobs]
        if not manager_job_ids:
            return []

        return self.db.query(Interview).filter(
            Interview.job_id.in_(manager_job_ids)
        ).all()
    
    def get_manager_stats(self, manager_id: int) -> Dict[str, Any]:
        """Get manager dashboard statistics"""
        manager_jobs = self._resolve_manager_jobs(manager_id)
        manager_job_ids = [job.id for job in manager_jobs]
        open_requisitions = sum(
            1 for job in manager_jobs
            if str(job.status).lower() in {"open", "draft"}
        )
        headcount = self.db.query(Offer).filter(
            Offer.job_id.in_(manager_job_ids) if manager_job_ids else false(),
            cast(Offer.status, String) == "joined"
        ).count()
        pending_offers = self.db.query(Offer).filter(
            Offer.job_id.in_(manager_job_ids) if manager_job_ids else false(),
            cast(Offer.status, String) == "offered"
        ).count()
        
        # Get interviews today
        today = datetime.utcnow().date()
        interviews_today = self.db.query(Interview).filter(
            cast(Interview.panel_members, String).like(f'%{manager_id}%'),
            func.date(Interview.scheduled_time) == today
        ).count()
        
        return {
            "headcount": headcount,
            "openReq": open_requisitions,
            "pendingOffers": pending_offers,
            "interviewsToday": interviews_today
        }
    
    def get_manager_pipeline(self, manager_id: int) -> List[Dict[str, Any]]:
        """Get pipeline stats for manager's requisitions"""
        manager_jobs = self._resolve_manager_jobs(manager_id)

        result = []
        for job in manager_jobs:
            apps_query = self.db.query(CandidateApplication).filter(CandidateApplication.job_id == job.id)
            profiles_received = apps_query.count()
            shortlisted = apps_query.filter(cast(CandidateApplication.status, String).in_(["shortlisted"])).count()
            interviewed = apps_query.filter(cast(CandidateApplication.status, String).in_(["interview", "offered", "joined"])).count()
            offered = apps_query.filter(cast(CandidateApplication.status, String).in_(["offered", "joined"])).count()
            hired = apps_query.filter(cast(CandidateApplication.status, String) == "joined").count()

            result.append({
                "jobTitle": job.title,
                "profilesReceived": profiles_received,
                "shortlisted": shortlisted,
                "interviewed": interviewed,
                "offered": offered,
                "hired": hired,
                "status": job.status,
                "mprId": job.id
            })
        
        return result

    def get_pipeline_candidates(self, manager_id: int, job_title: str, stage: str) -> List[Dict[str, Any]]:
        """Get candidate-level drill-down for a manager pipeline stage."""
        normalized_stage = (stage or "").strip().lower()
        manager_jobs = self._resolve_manager_jobs(manager_id)
        selected_jobs = [
            job for job in manager_jobs
            if not job_title or (job.title or "").strip().lower() == job_title.strip().lower()
        ]
        job_ids = [job.id for job in selected_jobs]
        if not job_ids:
            return []

        apps_query = self.db.query(CandidateApplication).filter(CandidateApplication.job_id.in_(job_ids))

        if normalized_stage in {"profile shortlisted", "shortlisted"}:
            apps_query = apps_query.filter(cast(CandidateApplication.status, String) == "shortlisted")
        elif normalized_stage in {"interviewed", "scheduled"}:
            apps_query = apps_query.filter(cast(CandidateApplication.status, String).in_(["interview", "offered", "joined"]))
        elif normalized_stage in {"offered"}:
            apps_query = apps_query.filter(cast(CandidateApplication.status, String).in_(["offered", "joined"]))
        elif normalized_stage in {"selected", "positions closed"}:
            apps_query = apps_query.filter(cast(CandidateApplication.status, String) == "joined")
        elif normalized_stage in {"rejected", "dnj"}:
            apps_query = apps_query.filter(cast(CandidateApplication.status, String) == "rejected")
        elif normalized_stage in {"on hold"}:
            apps_query = apps_query.filter(cast(CandidateApplication.status, String) == "hold")

        applications = apps_query.order_by(CandidateApplication.applied_at.desc()).all()
        result: List[Dict[str, Any]] = []
        for app in applications:
            candidate = app.candidate
            user = candidate.user if candidate else None
            resume_doc = None
            if candidate:
                resume_doc = self.db.query(CandidateDocument).filter(
                    CandidateDocument.candidate_id == candidate.id,
                    cast(CandidateDocument.document_type, String).like("resume%")
                ).order_by(CandidateDocument.uploaded_at.desc()).first()

            resume_url = ""
            if candidate and candidate.resume_url:
                resume_url = candidate.resume_url
            elif resume_doc:
                resume_url = resume_doc.document_url

            result.append(
                {
                    "id": f"CAND-{candidate.id}" if candidate else f"APP-{app.id}",
                    "candidateId": candidate.id if candidate else None,
                    "name": user.name if user else "",
                    "email": user.email if user else "",
                    "status": str(app.status or "").lower(),
                    "jobTitle": app.job.title if app.job else "",
                    "resumeUrl": resume_url,
                }
            )
        return result

manager_service = ManagerService
