"""
Admin dashboard service
"""
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from app.crud.user import crud_user
from app.crud.mpr import crud_mpr
from app.crud.blacklist import crud_blacklist
from app.crud.offer import crud_offer
from app.models.user import User
from app.models.mpr import MPR
from app.models.offer import Offer
from app.models.interview import Interview

class AdminService:
    def __init__(self, db: Session):
        self.db = db
    
    @staticmethod
    def _enum_value(value):
        return value.value if hasattr(value, "value") else value

    def get_admin_stats(self) -> Dict[str, Any]:
        """Get admin dashboard statistics"""
        # Total users by role
        total_users = self.db.query(User).count()
        admin_count = self.db.query(User).filter(User.role == "admin").count()
        recruiter_count = self.db.query(User).filter(User.role == "recruiter").count()
        manager_count = self.db.query(User).filter(User.role == "manager").count()
        candidate_count = self.db.query(User).filter(User.role == "candidate").count()
        
        # Active MPRs
        active_mprs = self.db.query(MPR).filter(MPR.status == "active").count()
        frozen_mprs = self.db.query(MPR).filter(MPR.status == "frozen").count()
        
        # Pending offers requiring approval
        pending_approvals = self.db.query(Offer).filter(
            Offer.requires_approval == True
        ).count()
        
        # Recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_logins = self.db.query(User).filter(
            User.last_login >= week_ago
        ).count()
        
        velocity_data = []
        for day_offset in range(4, -1, -1):
            day = (datetime.utcnow() - timedelta(days=day_offset)).date()
            day_key = day.isoformat()
            hires = self.db.query(Offer).filter(
                func.date(Offer.created_at) == day_key,
                Offer.status == "joined"
            ).count()
            interviews = self.db.query(Interview).filter(
                func.date(Interview.scheduled_time) == day_key
            ).count()
            velocity_data.append({"date": day_key, "hires": hires, "interviews": interviews})

        return {
            "kpis": [
                {"name": "Total Users", "value": total_users, "change": "0%"},
                {"name": "Active MPRs", "value": active_mprs, "change": "0%"},
                {"name": "Pending Approvals", "value": pending_approvals, "change": "0%"},
                {"name": "Recent Logins", "value": recent_logins, "change": "0%"}
            ],
            "velocityData": velocity_data,
            "userDistribution": [
                {"role": "Admin", "count": admin_count},
                {"role": "Recruiter", "count": recruiter_count},
                {"role": "Manager", "count": manager_count},
                {"role": "Candidate", "count": candidate_count}
            ],
            "mprStatus": [
                {"status": "Active", "count": active_mprs},
                {"status": "Frozen", "count": frozen_mprs},
                {"status": "Draft", "count": self.db.query(MPR).filter(MPR.status == "draft").count()},
                {"status": "Closed", "count": self.db.query(MPR).filter(MPR.status == "closed").count()}
            ]
        }
    
    def get_offer_audit_queue(self) -> List[Dict[str, Any]]:
        """Get offers requiring audit/approval"""
        offers = crud_offer.get_offers_requiring_approval(self.db)
        
        result = []
        for offer in offers:
            # Calculate variance
            variance = 0
            if offer.mpr and offer.mpr.budget_max:
                variance = ((offer.ctc_total - offer.mpr.budget_max) / offer.mpr.budget_max) * 100
            
            result.append({
                "id": offer.id,
                "candidate": offer.candidate.user.name if offer.candidate and offer.candidate.user else "",
                "role": offer.job.title if offer.job else "",
                "offer": offer.ctc_total,
                "variance": round(variance, 2),
                "status": self._enum_value(offer.status),
                "date": offer.created_at.isoformat()
            })
        
        return result

    def get_offers_analytics(self) -> Dict[str, Any]:
        """Get complete offers analytics for admin comp & offers screen."""
        offers = self.db.query(Offer).all()

        queue: List[Dict[str, Any]] = []
        budget_rollup: Dict[str, Dict[str, float]] = {}
        released = 0
        joined = 0
        declined = 0

        for offer in offers:
            department = (offer.job.department if offer.job and offer.job.department else "Unassigned").strip() or "Unassigned"
            budget_total = float(offer.mpr.budget_max) if offer.mpr and offer.mpr.budget_max else 0.0
            variance = float(offer.variance_percent) if offer.variance_percent is not None else 0.0

            if variance == 0.0 and budget_total > 0:
                variance = ((float(offer.ctc_total) - budget_total) / budget_total) * 100

            budget_entry = budget_rollup.setdefault(
                department,
                {"total": 0.0, "used": 0.0},
            )
            budget_entry["total"] += budget_total
            budget_entry["used"] += float(offer.ctc_total or 0.0)

            status = self._enum_value(offer.status)
            status_upper = str(status or "").upper()
            if status_upper in {"OFFERED", "ACCEPTED", "DECLINED", "JOINED"}:
                released += 1
            if status_upper == "JOINED":
                joined += 1
            if status_upper == "DECLINED":
                declined += 1

            queue.append({
                "id": offer.id,
                "candidate": offer.candidate.user.name if offer.candidate and offer.candidate.user else "",
                "role": offer.job.title if offer.job else "",
                "offer": float(offer.ctc_total or 0.0),
                "variance": round(variance, 2),
                "status": status,
                "auditStatus": "PENDING" if bool(offer.requires_approval) else "APPROVED",
                "requiresApproval": bool(offer.requires_approval),
                "date": offer.created_at.isoformat() if offer.created_at else None,
            })

        budget = []
        for dept, value in budget_rollup.items():
            total = float(value["total"])
            used = float(value["used"])
            used_percent = round((used / total) * 100, 2) if total > 0 else 0.0
            budget.append({
                "dept": dept,
                "total": round(total, 2),
                "used": used_percent,
            })

        budget.sort(key=lambda item: item["dept"])
        queue.sort(key=lambda item: item["id"], reverse=True)

        return {
            "queue": queue,
            "budget": budget,
            "velocity": {
                "released": released,
                "joined": joined,
                "declined": declined,
            },
        }

admin_service = AdminService
