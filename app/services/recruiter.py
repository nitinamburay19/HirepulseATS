"""
Recruiter dashboard service
"""
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.crud.mpr import crud_mpr
from app.crud.agency import crud_agency
from app.crud.candidate import crud_candidate
from app.crud.interview import crud_interview
from app.crud.offer import crud_offer
from app.models.mpr import MPR
from app.models.agency import Agency
from app.models.candidate import CandidateApplication
from app.models.interview import Interview
from app.models.offer import Offer
from sqlalchemy import cast, String, func

class RecruiterService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_recruiter_stats(self, recruiter_id: int) -> Dict[str, Any]:
        """Get recruiter dashboard statistics"""
        active_mprs = self.db.query(MPR).filter(
            func.lower(MPR.status) == "active"
        ).count()

        total_candidates = self.db.query(CandidateApplication).count()

        upcoming_interviews = self.db.query(Interview).filter(
            Interview.scheduled_time >= datetime.utcnow(),
            cast(Interview.status, String) == "scheduled"
        ).count()

        pending_offers = self.db.query(Offer).filter(
            cast(Offer.status, String) == "offered"
        ).count()

        screened_candidates = self.db.query(CandidateApplication).filter(
            func.lower(CandidateApplication.status).in_([
                "screening", "shortlisted", "interview", "interviewing", "offered", "hired", "joined"
            ])
        ).count()
        interviewed_candidates = self.db.query(CandidateApplication).filter(
            func.lower(CandidateApplication.status).in_([
                "interview", "interviewing", "offered", "hired", "joined"
            ])
        ).count()
        offered_candidates = self.db.query(Offer).filter(
            cast(Offer.status, String).in_(["offered", "accepted", "joined"])
        ).count()
        hired_candidates = self.db.query(Offer).filter(
            cast(Offer.status, String) == "joined"
        ).count()
        dnj_candidates = self.db.query(Offer).filter(
            cast(Offer.status, String).in_(["declined", "withdrawn", "expired"])
        ).count()

        total_released_offers = self.db.query(Offer).filter(
            cast(Offer.status, String) != "draft"
        ).count()
        accepted_offers = self.db.query(Offer).filter(
            cast(Offer.status, String).in_(["accepted", "joined"])
        ).count()
        offer_acceptance_rate = round((accepted_offers / total_released_offers) * 100, 1) if total_released_offers else 0.0

        return {
            "kpis": [
                {"name": "Active MPRs", "value": active_mprs, "change": "0"},
                {"name": "Candidates in Pipeline", "value": total_candidates, "change": "0%"},
                {"name": "Upcoming Interviews", "value": upcoming_interviews, "change": "0"},
                {"name": "Offers Pending", "value": pending_offers, "change": "0"}
            ],
            "matrixData": {
                "sourced": total_candidates,
                "screened": screened_candidates,
                "interviewed": interviewed_candidates,
                "offered": offered_candidates,
                "hired": hired_candidates,
                "dnj": dnj_candidates,
            },
            "performanceMetrics": {
                "timeToFill": 0,
                "offerAcceptanceRate": offer_acceptance_rate,
                "candidateSatisfaction": 0,
                "sourceEffectiveness": {
                    "agency": 0,
                    "referral": 0,
                    "direct": total_candidates,
                    "jobBoard": 0
                }
            }
        }
    
    def get_pipeline_matrix(self, recruiter_id: int) -> List[Dict[str, Any]]:
        """Get pipeline matrix data"""
        mprs = self.db.query(MPR).order_by(MPR.created_at.desc()).limit(50).all()
        rows: List[Dict[str, Any]] = []
        for mpr in mprs:
            stats = mpr.pipeline_stats if isinstance(mpr.pipeline_stats, dict) else {}
            rows.append(
                {
                    "mprId": mpr.requisition_code,
                    "role": mpr.job_title,
                    "sourced": int(stats.get("profilesReceived", 0) or 0),
                    "screened": int(stats.get("screened", 0) or 0),
                    "interviewed": int(stats.get("interviewed", 0) or 0),
                    "offered": int(stats.get("offered", 0) or 0),
                    "hired": int(stats.get("selected", 0) or 0),
                    "status": str(mpr.status).lower(),
                }
            )
        return rows

recruiter_service = RecruiterService
