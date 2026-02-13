"""
Candidate portal service with resume parsing
"""
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.crud.candidate import crud_candidate
from app.crud.job import crud_job
from app.services.resume_parser import resume_parser
from app.models.candidate import CandidateApplication
from app.models.offer import Offer
import os

class CandidateService:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _enum_value(value):
        return value.value if hasattr(value, "value") else value

    def _load_parsed_resume_data(self, candidate_id: int, documents: List[Any]) -> Dict[str, Any] | None:
        """Load parsed resume JSON for candidate using current and legacy file naming."""
        for doc in documents:
            if str(doc.document_type).lower() != "resume":
                continue

            parsed_candidates = []
            if doc.document_url:
                parsed_candidates.append(
                    f"uploads/parsed_resumes/{candidate_id}_{os.path.basename(str(doc.document_url))}.json"
                )
            parsed_candidates.append(
                f"uploads/parsed_resumes/{candidate_id}_{doc.file_name}.json"
            )

            for parsed_path in parsed_candidates:
                if not os.path.exists(parsed_path):
                    continue
                try:
                    import json
                    with open(parsed_path, "r") as f:
                        return json.load(f)
                except Exception:
                    continue
        return None

    def get_latest_parsed_resume_data(self, candidate_id: int) -> Dict[str, Any] | None:
        """Public accessor for latest parsed resume payload for a candidate."""
        documents = crud_candidate.get_documents_by_candidate(self.db, candidate_id)
        return self._load_parsed_resume_data(candidate_id, documents)
    
    def parse_and_update_profile(self, candidate_id: int, file_path: str) -> Dict[str, Any]:
        """
        Parse resume and update candidate profile with extracted data
        """
        try:
            # Parse resume
            parsed_data = resume_parser.parse_resume(file_path)
            
            if "error" in parsed_data:
                return {"success": False, "error": parsed_data["error"]}
            
            # Get candidate profile
            profile = crud_candidate.get_profile(self.db, candidate_id)
            if not profile:
                return {"success": False, "error": "Candidate profile not found"}
            
            # Update profile with parsed data
            update_data = {}
            
            # Update name (if not already set)
            if parsed_data.get("name") and not profile.user.name:
                profile.user.name = parsed_data["name"]
            
            # Update phone
            if parsed_data.get("phone") and not profile.phone:
                update_data["phone"] = parsed_data["phone"]
            
            # Update skills (merge with existing)
            existing_skills = set(profile.skills or [])
            new_skills = set(parsed_data.get("skills", []))
            all_skills = list(existing_skills.union(new_skills))
            if all_skills:
                update_data["skills"] = all_skills[:50]  # Limit to 50 skills
            
            # Update experience
            if parsed_data.get("experience") and not profile.experience_years:
                update_data["experience_years"] = parsed_data["experience"]
            
            # Update current company
            if parsed_data.get("companies") and not profile.current_company:
                update_data["current_company"] = parsed_data["companies"][0] if parsed_data["companies"] else ""
            
            # Apply updates
            if update_data:
                crud_candidate.update_profile(self.db, candidate_id, update_data)
            
            # Save parsed data for reference
            parsed_data_path = f"uploads/parsed_resumes/{candidate_id}_{os.path.basename(file_path)}.json"
            os.makedirs(os.path.dirname(parsed_data_path), exist_ok=True)
            
            with open(parsed_data_path, 'w') as f:
                import json
                json.dump(parsed_data, f, indent=2)
            
            return {
                "success": True,
                "parsed_data": parsed_data,
                "updates_applied": list(update_data.keys())
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_candidate_profile(self, candidate_id: int) -> Dict[str, Any]:
        """Get candidate profile with documents and parsed data"""
        profile = crud_candidate.get_profile(self.db, candidate_id)
        if not profile:
            return {}
        
        documents = crud_candidate.get_documents_by_candidate(self.db, candidate_id)
        
        parsed_data = self._load_parsed_resume_data(candidate_id, documents)

        return {
            "name": profile.user.name if profile.user else "",
            "role": self._enum_value(profile.user.role) if profile.user else "",
            "skills": profile.skills or [],
            "documents": [
                {
                    "id": doc.id,
                    "name": doc.file_name,
                    "type": doc.document_type,
                    "url": doc.document_url,
                    "uploaded_at": doc.uploaded_at.isoformat(),
                    "verified": bool(doc.verified),
                    "parsed": bool(doc.verified or parsed_data is not None) if str(doc.document_type).lower() == "resume" else False,
                }
                for doc in documents
            ],
            "profile": {
                "email": profile.user.email if profile.user else "",
                "phone": profile.phone,
                "address": profile.address,
                "city": profile.city,
                "country": profile.country,
                "experience_years": profile.experience_years,
                "current_company": profile.current_company,
                "current_position": profile.current_position,
                "expected_ctc": profile.expected_ctc,
                "notice_period": profile.notice_period
            },
            "parsed_data": parsed_data
        }
    
    def auto_fill_application(self, candidate_id: int, job_id: int) -> Dict[str, Any]:
        """
        Auto-fill job application with candidate profile and parsed resume data
        """
        try:
            # Get candidate profile
            profile = crud_candidate.get_profile(self.db, candidate_id)
            if not profile:
                return {"success": False, "error": "Profile not found"}
            
            documents = crud_candidate.get_documents_by_candidate(self.db, candidate_id)
            parsed_data = self._load_parsed_resume_data(candidate_id, documents)
            
            # Get job details
            job = crud_job.get_job(self.db, job_id)
            if not job:
                return {"success": False, "error": "Job not found"}
            
            # Prepare auto-filled application data
            application_data = {
                "personal_info": {
                    "name": profile.user.name if profile.user else "",
                    "email": profile.user.email if profile.user else "",
                    "phone": profile.phone or "",
                    "address": profile.address or "",
                    "city": profile.city or "",
                    "country": profile.country or "",
                    "linkedin": parsed_data.get("linkedin", "") if parsed_data else ""
                },
                "professional": {
                    "current_company": profile.current_company or "",
                    "current_position": profile.current_position or "",
                    "experience_years": profile.experience_years or 0,
                    "skills": profile.skills or [],
                    "summary": parsed_data.get("summary", "") if parsed_data else "",
                    "notice_period": profile.notice_period or 0,
                    "expected_ctc": profile.expected_ctc or 0
                },
                "education": [],
                "work_experience": []
            }
            
            # Add parsed education if available
            if parsed_data and parsed_data.get("education"):
                application_data["education"] = parsed_data["education"][:5]
            
            # Add parsed companies as work experience
            if parsed_data and parsed_data.get("companies"):
                for i, company in enumerate(parsed_data["companies"][:3]):
                    application_data["work_experience"].append({
                        "company": company,
                        "position": "Previous Role",
                        "duration": "Previous Employment"
                    })
            
            # Calculate match score with job requirements
            match_score = self._calculate_job_match(profile, parsed_data, job)
            
            return {
                "success": True,
                "application_data": application_data,
                "match_score": match_score,
                "suggestions": self._get_application_suggestions(profile, parsed_data, job)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _calculate_job_match(self, profile, parsed_data, job) -> float:
        """Calculate match score between candidate and job requirements"""
        score = 0
        max_score = 100
        
        # Skill match (40 points)
        required_skills = set([s.lower() for s in job.skills_required or []])
        candidate_skills = set([s.lower() for s in profile.skills or []])
        
        if required_skills:
            skill_match = len(required_skills.intersection(candidate_skills)) / len(required_skills)
            score += skill_match * 40
        
        # Experience match (30 points)
        if job.experience_required:
            if profile.experience_years >= job.experience_required:
                score += 30
            else:
                score += (profile.experience_years / job.experience_required) * 30
        
        # Education match (20 points)
        # Simplified - assume match if candidate has education data
        if parsed_data and parsed_data.get("education"):
            score += 20
        
        # Location match (10 points) - simplified
        if profile.city and job.location:
            # In production, use geocoding API
            score += 10
        
        return min(score, 100)
    
    def _get_application_suggestions(self, profile, parsed_data, job) -> List[str]:
        """Get suggestions for improving application"""
        suggestions = []
        
        # Check skills
        required_skills = set([s.lower() for s in job.skills_required or []])
        candidate_skills = set([s.lower() for s in profile.skills or []])
        
        missing_skills = required_skills - candidate_skills
        if missing_skills:
            suggestions.append(f"Consider highlighting these skills: {', '.join(missing_skills)}")
        
        # Check experience
        if job.experience_required and profile.experience_years < job.experience_required:
            suggestions.append(f"You have {profile.experience_years} years of experience, "
                             f"but {job.experience_required} are required. Emphasize relevant achievements.")
        
        # Check resume
        if not parsed_data:
            suggestions.append("Upload a resume to auto-fill more application details.")
        
        return suggestions
    
    def get_application_status(self, candidate_id: int) -> Dict[str, Any]:
        """Get candidate's application status with resume insights"""
        applications = crud_candidate.get_applications_by_candidate(self.db, candidate_id)
        
        if not applications:
            return {
                "message": "No applications found",
                "has_resume": False,
                "pipelineSteps": [],
                "currentStatus": "not_applied",
            }
        
        # Check if candidate has a resume
        has_resume = False
        documents = crud_candidate.get_documents_by_candidate(self.db, candidate_id)
        for doc in documents:
            if doc.document_type == "resume":
                has_resume = True
                break
        
        # Get the most recent application
        latest_app = max(applications, key=lambda x: x.applied_at)
        active_offer = self.db.query(Offer).filter(
            Offer.candidate_id == candidate_id,
            Offer.job_id == latest_app.job_id,
        ).order_by(Offer.created_at.desc()).first()
        
        status_flow = ["applied", "screening", "shortlisted", "interview", "offered", "joined"]
        current_status = str(latest_app.status or "applied").lower()
        current_index = status_flow.index(current_status) if current_status in status_flow else -1

        pipeline_steps = [
            {"label": "Application Submitted", "status": "done", "date": latest_app.applied_at.isoformat()},
            {
                "label": "Resume Screening",
                "status": "done" if current_index > 0 else ("active" if current_status == "screening" else "pending"),
                "date": latest_app.updated_at.isoformat() if latest_app.updated_at and current_index >= 1 else None
            },
            {
                "label": "Shortlisted",
                "status": "done" if current_index > 2 else ("active" if current_status == "shortlisted" else "pending"),
                "date": latest_app.updated_at.isoformat() if latest_app.updated_at and current_index >= 2 else None
            },
            {
                "label": "Interview",
                "status": "done" if current_index > 3 else ("active" if current_status == "interview" else "pending"),
                "date": latest_app.updated_at.isoformat() if latest_app.updated_at and current_index >= 3 else None
            },
            {
                "label": "Offer",
                "status": "done" if current_index > 4 else ("active" if current_status == "offered" else "pending"),
                "date": latest_app.updated_at.isoformat() if latest_app.updated_at and current_index >= 4 else None
            },
            {
                "label": "Joined",
                "status": "done" if current_status == "joined" else "pending",
                "date": latest_app.updated_at.isoformat() if latest_app.updated_at and current_status == "joined" else None
            },
        ]

        if current_status == "rejected":
            pipeline_steps.append(
                {
                    "label": "Rejected",
                    "status": "active",
                    "date": latest_app.updated_at.isoformat() if latest_app.updated_at else None,
                }
            )

        job = latest_app.job
        responsibilities = []
        if job and job.responsibilities:
            responsibilities = job.responsibilities if isinstance(job.responsibilities, list) else [str(job.responsibilities)]
        requirements = []
        if job and job.requirements:
            requirements = job.requirements if isinstance(job.requirements, list) else [str(job.requirements)]
        summary_parts = [part for part in [job.description if job else "", *(requirements[:2] if requirements else [])] if part]

        return {
            "jobDetails": {
                "id": f"APP-{latest_app.id}",
                "title": latest_app.job.title if latest_app.job else "",
                "department": latest_app.job.department if latest_app.job else "",
                "location": latest_app.job.location if latest_app.job else "",
                "summary": " ".join(summary_parts)[:400] if summary_parts else "Application submitted successfully.",
                "responsibilities": responsibilities[:6],
                "skills": latest_app.job.skills_required if latest_app.job and latest_app.job.skills_required else [],
                "appliedDate": latest_app.applied_at.isoformat(),
                "skillsMatch": latest_app.ai_score or 0
            },
            "pipelineSteps": pipeline_steps,
            "currentStatus": current_status,
            "applicationId": latest_app.id,
            "hasResume": has_resume,
            "resumeScore": latest_app.ai_score or 0,
            "offer": (
                {
                    "id": active_offer.id,
                    "offerCode": active_offer.offer_code,
                    "status": str(self._enum_value(active_offer.status)).lower(),
                    "ctcTotal": active_offer.ctc_total,
                    "dateOfJoining": active_offer.date_of_joining.isoformat() if active_offer.date_of_joining else None,
                    "validityDays": active_offer.offer_validity_days,
                    "offeredAt": active_offer.offered_at.isoformat() if active_offer.offered_at else None,
                    "joinRequest": (
                        active_offer.other_benefits.get("joining_request")
                        if isinstance(active_offer.other_benefits, dict)
                        else None
                    ),
                }
                if active_offer else None
            ),
        }

candidate_service = CandidateService
