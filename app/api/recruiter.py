"""
Recruiter dashboard API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.database import get_db
from app.utils.dependencies import get_current_user, require_role, require_any_role
from app.schemas.agency import AgencyCreate, AgencyResponse, AgencyStatusUpdate
from app.schemas.job import JobCreate, JobResponse, JobUpdate
from app.schemas.mpr import MPRResponse
from app.schemas.candidate import CandidateApplicationResponse
from app.schemas.interview import InterviewResponse, InterviewEvaluationCreate
from app.schemas.offer import OfferCreate, OfferResponse, OfferStatusUpdate
from app.crud.agency import crud_agency
from app.crud.job import crud_job
from app.crud.mpr import crud_mpr
from app.crud.candidate import crud_candidate
from app.crud.interview import crud_interview
from app.crud.offer import crud_offer
from app.services.recruiter import recruiter_service
from app.services.notifications import notification_service
from pydantic import ValidationError
from app.models.candidate import CandidateApplication, CandidateDocument
from app.models.interview import Interview, InterviewEvaluation, InterviewRound, InterviewMode, InterviewStatus
from app.models.offer import Offer
from app.models.mpr import MPR

router = APIRouter()


def _enum_value(value):
    return value.value if hasattr(value, "value") else value


def _generate_job_content(title: str) -> Dict[str, str]:
    normalized_title = (title or "").strip()
    lower_title = normalized_title.lower()

    templates = [
        (
            ["frontend", "react", "ui", "web"],
            "deliver polished user experiences and resilient frontend architecture",
            [
                "Build reusable UI components aligned with the design system.",
                "Collaborate with product and backend teams on end-to-end features.",
                "Improve performance, accessibility, and reliability of core journeys.",
            ],
            ["React", "TypeScript", "REST APIs", "Testing"],
        ),
        (
            ["backend", "api", "python", "node", "java", "golang"],
            "build secure, scalable backend services for business-critical workflows",
            [
                "Design and maintain robust APIs and integrations.",
                "Optimize data access patterns and query performance.",
                "Implement observability, error handling, and service hardening.",
            ],
            ["API Design", "SQL", "Authentication", "Cloud"],
        ),
        (
            ["data", "analyst", "scientist", "ml", "ai"],
            "convert data into actionable insights and predictive decision support",
            [
                "Develop analytical datasets and operational dashboards.",
                "Build and evaluate statistical or ML models when needed.",
                "Partner with business stakeholders on KPI tracking and improvement.",
            ],
            ["SQL", "Python", "Data Modeling", "Visualization"],
        ),
    ]

    mission = "drive measurable outcomes through cross-functional execution"
    responsibilities = [
        "Own critical deliverables and execute with quality and speed.",
        "Collaborate with stakeholders to align scope, timelines, and outcomes.",
        "Document decisions and continuously improve delivery processes.",
    ]
    skills = ["Communication", "Execution", "Planning", "Problem Solving"]

    for keywords, template_mission, template_resp, template_skills in templates:
        if any(keyword in lower_title for keyword in keywords):
            mission = template_mission
            responsibilities = template_resp
            skills = template_skills
            break

    summary = f"{normalized_title} is expected to {mission}."
    description = "\n".join(
        [
            f"Role: {normalized_title}",
            "",
            "Key Responsibilities:",
            *[f"{idx + 1}. {line}" for idx, line in enumerate(responsibilities)],
            "",
            "Preferred Skills:",
            *[f"- {skill}" for skill in skills],
        ]
    )
    return {"summary": summary, "description": description}


def _ensure_interview_pipeline_seed(db: Session, recruiter_id: int) -> None:
    created_interviews: List[Interview] = []
    candidate_apps = db.query(CandidateApplication).filter(
        CandidateApplication.status.in_(["shortlisted", "interview"])
    ).all()

    for app in candidate_apps:
        existing_interview = db.query(Interview).filter(
            Interview.candidate_id == app.candidate_id,
            Interview.job_id == app.job_id,
            Interview.status.in_([InterviewStatus.SCHEDULED.value, InterviewStatus.COMPLETED.value]),
        ).first()
        if existing_interview:
            continue

        interview = Interview(
            candidate_id=app.candidate_id,
            job_id=app.job_id,
            round=InterviewRound.SCREENING.value,
            scheduled_time=datetime.utcnow() + timedelta(days=1),
            duration_minutes=60,
            mode=InterviewMode.VIDEO_CALL.value,
            status=InterviewStatus.SCHEDULED.value,
            panel_members=[recruiter_id],
            notes="Auto-created from shortlisted pipeline",
            created_by=recruiter_id,
        )
        db.add(interview)
        created_interviews.append(interview)
    db.commit()

    notifier = notification_service(db)
    for interview in created_interviews:
        candidate_user = interview.candidate.user if interview.candidate else None
        if not candidate_user or not candidate_user.email:
            continue
        try:
            notifier.send_candidate_event(
                event="interview_scheduled",
                to_email=candidate_user.email,
                candidate_name=candidate_user.name or "Candidate",
                user_id=candidate_user.id,
                candidate_id=interview.candidate_id,
                payload={
                    "job_title": interview.job.title if interview.job else "the role",
                    "interview_date": interview.scheduled_time.date().isoformat() if interview.scheduled_time else "TBD",
                    "interview_time": interview.scheduled_time.strftime("%H:%M") if interview.scheduled_time else "TBD",
                    "interview_mode": _enum_value(interview.mode),
                    "company": "HirePulse",
                },
            )
        except Exception:
            continue

@router.get("/stats/recruiter-dashboard", response_model=Dict[str, Any])
async def get_recruiter_stats(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Get recruiter dashboard statistics
    
    Fetch KPIs and the main pipeline matrix for the recruiter
    """
    service = recruiter_service(db)
    return service.get_recruiter_stats(current_user["id"])

@router.get("/agencies", response_model=List[Dict[str, Any]])
async def get_all_agencies(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Get all agencies
    
    Get a list of all recruitment agencies
    """
    agencies = crud_agency.get_all_agencies(db)
    return [
        {
            "id": agency.id,
            "name": agency.name,
            "tier": _enum_value(agency.tier),
            "sla": agency.sla_days,
            "status": _enum_value(agency.status),
            "location": agency.location,
            "spocName": agency.spoc_name,
            "spocEmail": agency.spoc_email
        }
        for agency in agencies
    ]

@router.post("/agencies", response_model=Dict[str, Any])
async def empanel_new_agency(
    agency_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Empanel new agency
    
    Add and empanel a new agency partner
    """
    # Convert to schema
    try:
        create_data = AgencyCreate(
            name=agency_data["agencyName"],
            headquarters=agency_data.get("hq"),
            agency_type=agency_data.get("type"),
            structure=agency_data.get("structure"),
            spoc_name=agency_data["spoc"],
            spoc_email=agency_data.get("spocEmail"),
            spoc_phone=agency_data.get("spocPhone"),
            sla_days=agency_data.get("sla", 30),
            location=agency_data.get("location"),
            website=agency_data.get("website"),
            notes=agency_data.get("notes")
        )
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing required field: {exc.args[0]}",
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(),
        )
    
    agency = crud_agency.create_agency(db, create_data)
    return {
        "id": agency.id,
        "name": agency.name,
        "tier": _enum_value(agency.tier),
        "status": _enum_value(agency.status)
    }

@router.put("/agencies/{agency_id}/status", response_model=Dict[str, Any])
async def update_agency_status(
    agency_id: int,
    status_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Update agency status
    
    Change the status of an agency
    """
    agency = crud_agency.update_agency_status(db, agency_id, status_data["status"])
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )
    
    return {"message": "Updated"}

@router.delete("/agencies/{agency_id}")
async def delete_agency(
    agency_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Delete agency
    
    Delete an agency from the system
    """
    success = crud_agency.delete_agency(db, agency_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )
    
    return {}  # 204 No Content

@router.post("/agencies/submit-candidate", response_model=Dict[str, Any])
async def agency_candidate_submission(
    submission_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Agency candidate submission
    
    Allow an agency to submit a candidate profile against a job
    """
    candidate_id = submission_data.get("candidateId")
    job_id = submission_data.get("jobId")
    if not candidate_id or not job_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="candidateId and jobId are required",
        )

    candidate = crud_candidate.get_profile(db, int(candidate_id))
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    job = crud_job.get_job(db, int(job_id))
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    db_application = CandidateApplication(
        candidate_id=candidate.id,
        job_id=job.id,
        status=str(submission_data.get("status", "applied")).lower(),
        application_data=submission_data.get("applicationData") or {},
        ai_score=submission_data.get("aiScore"),
        screening_notes=submission_data.get("notes"),
    )
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return {
        "submissionId": db_application.id,
        "candidateId": candidate.id,
        "jobId": job.id,
        "message": "Candidate submitted successfully",
    }

@router.get("/jobs", response_model=List[Dict[str, Any]])
async def get_all_jobs(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Get all jobs
    
    Get all job requisitions (for internal view)
    """
    jobs = crud_job.get_all_jobs(db)
    return [
        {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "dept": job.department,
            "posted": job.posted_at.isoformat() if job.posted_at else None,
            "status": job.status
        }
        for job in jobs
    ]

@router.post("/jobs", response_model=Dict[str, Any])
async def create_job_posting(
    job_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Create job posting
    
    Create a new job posting/requisition
    """
    resolved_manager_id = job_data.get("managerId")
    if not resolved_manager_id:
        mpr_id = job_data.get("mprId")
        if mpr_id is not None:
            try:
                linked_mpr = crud_mpr.get_mpr(db, int(mpr_id))
            except (TypeError, ValueError):
                linked_mpr = None
            if linked_mpr:
                resolved_manager_id = linked_mpr.hiring_manager_id

    if not resolved_manager_id:
        title = str(job_data.get("title", "")).strip()
        dept = str(job_data.get("dept", "")).strip()
        if title:
            title_match_query = db.query(MPR).filter(MPR.job_title.ilike(title))
            if dept:
                matched_mpr = title_match_query.filter(
                    MPR.department.ilike(dept),
                ).order_by(MPR.created_at.desc()).first()
                if not matched_mpr:
                    matched_mpr = title_match_query.order_by(MPR.created_at.desc()).first()
            else:
                matched_mpr = title_match_query.order_by(MPR.created_at.desc()).first()
            if matched_mpr:
                resolved_manager_id = matched_mpr.hiring_manager_id

    # Convert to schema
    create_data = JobCreate(
        title=job_data["title"],
        description=job_data.get("description", ""),
        department=job_data["dept"],
        location=job_data.get("location"),
        job_type=job_data.get("jobType"),
        experience_required=job_data.get("experienceRequired", 0),
        budget_min=job_data.get("budgetMin"),
        budget_max=job_data.get("budgetMax"),
        skills_required=job_data.get("skillsRequired", []),
        responsibilities=job_data.get("responsibilities"),
        requirements=job_data.get("requirements"),
        manager_id=resolved_manager_id,
        visibility=job_data.get("visibility", "internal")
    )
    
    job = crud_job.create_job(db, create_data)
    return {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "status": job.status
    }


@router.post("/jobs/generate-description", response_model=Dict[str, Any])
async def generate_job_description(
    payload: Dict[str, Any],
    current_user: Dict = Depends(require_any_role(["recruiter", "manager", "admin"]))
):
    """
    Generate job summary and description content from a job title.
    """
    title = str(payload.get("title", "")).strip()
    if not title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="title is required",
        )
    return _generate_job_content(title)


@router.put("/jobs/{job_id}", response_model=Dict[str, Any])
async def update_job_posting(
    job_id: int,
    job_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Update job posting

    Update recruiter job posting fields.
    """
    payload: Dict[str, Any] = {}
    if "title" in job_data:
        payload["title"] = job_data.get("title")
    if "description" in job_data:
        payload["description"] = job_data.get("description")
    if "dept" in job_data or "department" in job_data:
        payload["department"] = job_data.get("dept") or job_data.get("department")
    if "location" in job_data:
        payload["location"] = job_data.get("location")
    if "budgetMin" in job_data:
        payload["budget_min"] = job_data.get("budgetMin")
    if "budgetMax" in job_data:
        payload["budget_max"] = job_data.get("budgetMax")
    if "skillsRequired" in job_data:
        payload["skills_required"] = job_data.get("skillsRequired")
    if "responsibilities" in job_data:
        payload["responsibilities"] = job_data.get("responsibilities")
    if "requirements" in job_data:
        payload["requirements"] = job_data.get("requirements")
    if "status" in job_data:
        payload["status"] = job_data.get("status")
    if "postedAt" in job_data:
        payload["posted_at"] = job_data.get("postedAt")
    if "closedAt" in job_data:
        payload["closed_at"] = job_data.get("closedAt")
    if "managerId" in job_data:
        payload["manager_id"] = job_data.get("managerId")

    update_data = JobUpdate(**payload)

    updated = crud_job.update_job(db, job_id, update_data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    return {
        "id": updated.id,
        "title": updated.title,
        "department": updated.department,
        "description": updated.description,
        "status": updated.status
    }


@router.post("/jobs/publish-drafts", response_model=Dict[str, Any])
async def publish_draft_jobs(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Publish all draft jobs

    Moves all draft jobs to open/public so they appear on candidate job board.
    """
    updated = crud_job.publish_draft_jobs(db)
    return {"updated": updated, "message": f"{updated} draft job(s) published"}


@router.delete("/jobs/{job_id}", response_model=Dict[str, Any])
async def delete_job_posting(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Delete job posting

    Delete a recruiter-created job posting by ID.
    """
    deleted = crud_job.delete_job(db, job_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    return {"message": "Deleted"}

@router.get("/mpr", response_model=List[Dict[str, Any]])
async def get_all_mprs(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Get all MPRs
    
    Get all Manpower Requisitions
    """
    mprs = crud_mpr.get_all_mprs(db)
    return [
        {
            "id": mpr.id,
            "manager": mpr.hiring_manager.name if mpr.hiring_manager else "",
            "jobRole": mpr.job_title,
            "department": mpr.department,
            "status": mpr.status,
            "createdAt": mpr.created_at.isoformat() if mpr.created_at else None,
            "targetDate": None,
            "daysLeft": 0,
            "positionsRequested": mpr.positions_requested,
            "positionsApproved": mpr.positions_approved,
            "pipelineStats": mpr.pipeline_stats
        }
        for mpr in mprs
    ]

@router.put("/mpr/{mpr_id}/status", response_model=Dict[str, Any])
async def update_mpr_status(
    mpr_id: int,
    status_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Update MPR status
    
    Freeze or unfreeze an MPR
    """
    mpr = crud_mpr.update_mpr_status(db, mpr_id, status_data["status"])
    if not mpr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MPR not found"
        )
    
    return {"message": "Updated"}

@router.get("/candidates", response_model=List[Dict[str, Any]])
async def get_all_candidates(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Get all candidates
    
    Retrieve all candidates in the database
    """
    candidates = crud_candidate.get_all_profiles(db)
    response: List[Dict[str, Any]] = []
    for candidate in candidates:
        latest_application = db.query(CandidateApplication).filter(
            CandidateApplication.candidate_id == candidate.id
        ).order_by(CandidateApplication.applied_at.desc()).first()
        candidate_docs = db.query(CandidateDocument).filter(
            CandidateDocument.candidate_id == candidate.id
        ).all()
        latest_resume = next(
            (
                d for d in sorted(
                    candidate_docs,
                    key=lambda x: x.uploaded_at.isoformat() if x.uploaded_at else "",
                    reverse=True
                )
                if str(d.document_type).lower() == "resume"
            ),
            None
        )

        def _doc_status(doc_type: str) -> str:
            doc = next(
                (
                    d for d in candidate_docs
                    if str(d.document_type).lower() == doc_type
                    or str(d.document_type).lower().startswith(f"{doc_type}_")
                ),
                None
            )
            if not doc:
                return "MISSING"
            return "VERIFIED" if bool(doc.verified) else "PENDING"

        response.append(
            {
                "id": candidate.id,
                "name": candidate.user.name if candidate.user else "",
                "email": candidate.user.email if candidate.user else "",
                "skills": candidate.skills or [],
                "experience": candidate.experience_years,
                "currentCompany": candidate.current_company,
                "currentRole": latest_application.job.title if latest_application and latest_application.job else candidate.current_position,
                "status": latest_application.status if latest_application else "applied",
                "matchScore": latest_application.ai_score if latest_application and latest_application.ai_score is not None else 0,
                "appliedDate": latest_application.applied_at.isoformat() if latest_application and latest_application.applied_at else None,
                "applicationId": latest_application.id if latest_application else None,
                "resumeUrl": candidate.resume_url or (latest_resume.document_url if latest_resume else ""),
                "aadhaarStatus": _doc_status("aadhaar"),
                "panStatus": _doc_status("pan"),
            }
        )
    return response

@router.put("/candidates/{candidate_id}/status", response_model=Dict[str, Any])
async def update_candidate_status(
    candidate_id: int,
    status_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Update latest application status for a candidate.
    """
    new_status = str(status_data.get("status", "")).strip().lower()
    if not new_status:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="status is required",
        )

    allowed_statuses = {
        "applied", "screening", "shortlisted", "interview", "offered", "joined", "rejected"
    }
    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported status: {new_status}",
        )

    candidate = crud_candidate.get_profile(db, candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    latest_application = db.query(CandidateApplication).filter(
        CandidateApplication.candidate_id == candidate_id
    ).order_by(CandidateApplication.applied_at.desc()).first()
    if not latest_application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No application found for candidate",
        )

    latest_application.status = new_status
    if "notes" in status_data:
        latest_application.screening_notes = status_data.get("notes")
    db.add(latest_application)

    scheduled_interview = None
    if new_status == "shortlisted":
        existing_interview = db.query(Interview).filter(
            Interview.candidate_id == candidate_id,
            Interview.job_id == latest_application.job_id,
            Interview.status.in_([InterviewStatus.SCHEDULED.value, InterviewStatus.COMPLETED.value]),
        ).first()
        if not existing_interview:
            scheduled_interview = Interview(
                candidate_id=candidate_id,
                job_id=latest_application.job_id,
                round=InterviewRound.SCREENING.value,
                scheduled_time=datetime.utcnow() + timedelta(days=1),
                duration_minutes=60,
                mode=InterviewMode.VIDEO_CALL.value,
                status=InterviewStatus.SCHEDULED.value,
                panel_members=[current_user["id"]],
                notes="Auto-scheduled after shortlist decision",
                created_by=current_user["id"],
            )
            db.add(scheduled_interview)

    db.commit()
    db.refresh(latest_application)
    if scheduled_interview:
        db.refresh(scheduled_interview)

    candidate_user = candidate.user if candidate else None
    if candidate_user and candidate_user.email:
        email_event = None
        if new_status == "shortlisted":
            email_event = "selected"
        elif new_status == "rejected":
            email_event = "rejected"
        if email_event:
            try:
                notification_service(db).send_candidate_event(
                    event=email_event,
                    to_email=candidate_user.email,
                    candidate_name=candidate_user.name or "Candidate",
                    user_id=candidate_user.id,
                    candidate_id=candidate.id,
                    payload={
                        "job_title": latest_application.job.title if latest_application.job else "the role",
                        "company": "HirePulse",
                    },
                )
            except Exception:
                pass

        if new_status == "shortlisted" and scheduled_interview:
            try:
                notification_service(db).send_candidate_event(
                    event="interview_scheduled",
                    to_email=candidate_user.email,
                    candidate_name=candidate_user.name or "Candidate",
                    user_id=candidate_user.id,
                    candidate_id=candidate.id,
                    payload={
                        "job_title": latest_application.job.title if latest_application.job else "the role",
                        "interview_date": scheduled_interview.scheduled_time.date().isoformat(),
                        "interview_time": scheduled_interview.scheduled_time.strftime("%H:%M"),
                        "interview_mode": _enum_value(scheduled_interview.mode),
                        "company": "HirePulse",
                    },
                )
            except Exception:
                pass

    return {
        "candidateId": candidate_id,
        "applicationId": latest_application.id,
        "status": latest_application.status,
        "message": "Candidate status updated",
    }

@router.delete("/candidates/{candidate_id}", response_model=Dict[str, Any])
async def delete_candidate_profile(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Delete candidate profile and related pipeline artifacts.
    """
    candidate = crud_candidate.get_profile(db, candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    interview_ids = [
        row[0] for row in db.query(Interview.id).filter(Interview.candidate_id == candidate_id).all()
    ]
    if interview_ids:
        db.query(InterviewEvaluation).filter(
            InterviewEvaluation.interview_id.in_(interview_ids)
        ).delete(synchronize_session=False)

    db.query(Offer).filter(Offer.candidate_id == candidate_id).delete(synchronize_session=False)
    db.query(Interview).filter(Interview.candidate_id == candidate_id).delete(synchronize_session=False)
    db.query(CandidateApplication).filter(CandidateApplication.candidate_id == candidate_id).delete(synchronize_session=False)
    db.query(CandidateDocument).filter(CandidateDocument.candidate_id == candidate_id).delete(synchronize_session=False)
    db.delete(candidate)
    db.commit()

    return {"message": "Candidate deleted"}

@router.post("/candidates/{candidate_id}/screen", response_model=Dict[str, Any])
async def ai_candidate_screening(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    AI candidate screening
    
    Run AI screening on a candidate's resume artifact
    """
    candidate = crud_candidate.get_profile(db, candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    latest_application = db.query(CandidateApplication).filter(
        CandidateApplication.candidate_id == candidate_id
    ).order_by(CandidateApplication.applied_at.desc()).first()

    skills = candidate.skills or []
    experience_years = candidate.experience_years or 0
    profile_score = min(100, 45 + len(skills) * 6 + experience_years * 4 + (10 if candidate.resume_url else 0))
    score = int(latest_application.ai_score) if latest_application and latest_application.ai_score is not None else int(profile_score)

    recommendation = "Proceed to interview" if score >= 75 else "Needs further review"
    confidence = round(min(0.99, 0.55 + (score / 250)), 2)
    summary = (
        f"Candidate profile has {len(skills)} mapped skill(s) and {experience_years} year(s) experience. "
        f"Current screening score is {score}."
    )
    return {
        "score": score,
        "summary": summary,
        "recommendation": recommendation,
        "confidence": confidence
    }

@router.get("/interviews", response_model=List[Dict[str, Any]])
async def get_all_interviews(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Get all interviews
    
    Get a list of all scheduled/completed interviews
    """
    _ensure_interview_pipeline_seed(db, current_user["id"])
    interviews = crud_interview.get_all_interviews(db)
    return [
        {
            "id": interview.id,
            "candidateId": interview.candidate_id,
            "candidate": interview.candidate.user.name if interview.candidate and interview.candidate.user else "",
            "round": _enum_value(interview.round),
            "time": interview.scheduled_time.isoformat(),
            "panel": interview.panel_members,
            "mode": _enum_value(interview.mode),
            "status": _enum_value(interview.status)
        }
        for interview in interviews
    ]


@router.delete("/interviews/{interview_id}", response_model=Dict[str, Any])
async def delete_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Delete interview

    Remove an interview artifact from recruiter interview hub.
    """
    success = crud_interview.delete_interview(db, interview_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )
    return {"message": "Deleted"}

@router.post("/interviews/evaluation", response_model=Dict[str, Any])
async def submit_interview_evaluation(
    evaluation_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Submit interview evaluation
    
    Submit the multi-panel feedback for an interview
    """
    interview_id = evaluation_data.get("interviewId")
    candidate_id = evaluation_data.get("candidateId")
    if not interview_id or not candidate_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="interviewId and candidateId are required",
        )

    interview = crud_interview.get_interview(db, int(interview_id))
    if not interview:
        latest_app = db.query(CandidateApplication).filter(
            CandidateApplication.candidate_id == int(candidate_id)
        ).order_by(CandidateApplication.applied_at.desc()).first()
        interview = Interview(
            candidate_id=int(candidate_id),
            job_id=latest_app.job_id if latest_app else None,
            round=InterviewRound.SCREENING.value,
            scheduled_time=datetime.utcnow(),
            duration_minutes=60,
            mode=InterviewMode.VIDEO_CALL.value,
            status=InterviewStatus.COMPLETED.value,
            panel_members=[current_user["id"]],
            notes="Auto-created during evaluation submission",
            created_by=current_user["id"],
        )
        db.add(interview)
        db.commit()
        db.refresh(interview)

    # Convert to schema
    try:
        create_data = InterviewEvaluationCreate(
            interview_id=interview.id,
            candidate_id=int(candidate_id),
            evaluator_id=current_user["id"],
            technical_rating=evaluation_data.get("technicalRating"),
            communication_rating=evaluation_data.get("communicationRating"),
            cultural_fit_rating=evaluation_data.get("culturalFitRating"),
            overall_rating=evaluation_data["overallRating"],
            strengths=evaluation_data.get("strengths"),
            weaknesses=evaluation_data.get("weaknesses"),
            outcome=evaluation_data["outcome"],
            recommendation=evaluation_data.get("recommendation"),
            feedback=evaluation_data["feedback"]
        )
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing required field: {exc.args[0]}",
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(),
        )
    
    existing_evaluation = crud_interview.get_evaluation_by_interview(db, interview.id)
    if existing_evaluation:
        existing_evaluation.overall_rating = create_data.overall_rating
        existing_evaluation.outcome = create_data.outcome
        existing_evaluation.feedback = create_data.feedback
        existing_evaluation.recommendation = create_data.recommendation
        existing_evaluation.technical_rating = create_data.technical_rating
        existing_evaluation.communication_rating = create_data.communication_rating
        existing_evaluation.cultural_fit_rating = create_data.cultural_fit_rating
        db.add(existing_evaluation)
        db.commit()
        db.refresh(existing_evaluation)
        evaluation = existing_evaluation
    else:
        evaluation = crud_interview.create_evaluation(db, create_data)

    interview.status = InterviewStatus.COMPLETED.value
    db.add(interview)

    latest_application = db.query(CandidateApplication).filter(
        CandidateApplication.candidate_id == int(candidate_id)
    ).order_by(CandidateApplication.applied_at.desc()).first()
    if latest_application:
        outcome_value = str(evaluation_data.get("outcome", "")).strip().lower()
        latest_application.status = "rejected" if outcome_value in {"rejected", "reject", "fail"} else "interview"
        db.add(latest_application)

    db.commit()

    outcome_value = str(evaluation_data.get("outcome", "")).strip().lower()
    candidate_profile = crud_candidate.get_profile(db, int(candidate_id))
    if candidate_profile and candidate_profile.user and candidate_profile.user.email:
        if outcome_value in {"rejected", "reject", "fail"}:
            try:
                notification_service(db).send_candidate_event(
                    event="rejected",
                    to_email=candidate_profile.user.email,
                    candidate_name=candidate_profile.user.name or "Candidate",
                    user_id=candidate_profile.user.id,
                    candidate_id=candidate_profile.id,
                    payload={
                        "job_title": latest_application.job.title if latest_application and latest_application.job else "the role",
                        "company": "HirePulse",
                    },
                )
            except Exception:
                pass

    return {"message": "Success", "evaluationId": evaluation.id}

@router.get("/offers", response_model=List[Dict[str, Any]])
async def get_all_offers(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Get all offers
    
    Get all offers released
    """
    offers = crud_offer.get_all_offers(db)
    return [
        {
            "id": offer.id,
            "candidate": offer.candidate.user.name if offer.candidate and offer.candidate.user else "",
            "role": offer.job.title if offer.job else "",
            "ctc": offer.ctc_total,
            "status": _enum_value(offer.status),
            "joining": offer.date_of_joining.isoformat() if offer.date_of_joining else None,
            "joinRequestPending": bool(
                isinstance(offer.other_benefits, dict)
                and isinstance(offer.other_benefits.get("joining_request"), dict)
                and str(offer.other_benefits.get("joining_request", {}).get("status", "")).lower() == "pending"
            ),
        }
        for offer in offers
    ]

@router.post("/offers", response_model=Dict[str, Any])
async def release_new_offer(
    offer_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Release new offer
    
    Create and release a new job offer
    """
    # Validate and normalize candidate/job references first to avoid DB-level 500s.
    candidate_id_raw = offer_data.get("candidateId")
    job_id_raw = offer_data.get("jobId")
    try:
        candidate_id_int = int(candidate_id_raw)
        job_id_int = int(job_id_raw)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="candidateId and jobId must be numeric values",
        )

    candidate_profile = crud_candidate.get_profile(db, candidate_id_int) or crud_candidate.get_profile_by_user_id(db, candidate_id_int)
    if not candidate_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found. Use candidate profile ID from Recruiter -> Candidates table.",
        )

    job = crud_job.get_job(db, job_id_int)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found. Use a valid Job ID from Recruiter -> Job Postings.",
        )

    # Generate offer code
    import uuid
    offer_code = f"OFFER-{uuid.uuid4().hex[:8].upper()}"
    
    # Convert to schema
    try:
        create_data = OfferCreate(
            candidate_id=candidate_profile.id,
            job_id=job.id,
            mpr_id=offer_data.get("mprId"),
            ctc_fixed=offer_data["ctcFixed"],
            ctc_variable=offer_data.get("ctcVariable", 0),
            joining_bonus=offer_data.get("joiningBonus", 0),
            relocation_bonus=offer_data.get("relocationBonus", 0),
            other_benefits=offer_data.get("otherBenefits", {}),
            date_of_joining=offer_data["doj"],
            offer_validity_days=offer_data.get("validityDays", 15),
            notes=offer_data.get("notes"),
            offer_code=offer_code
        )
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing required field: {exc.args[0]}",
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(),
        )
    
    application = db.query(CandidateApplication).filter(
        CandidateApplication.candidate_id == candidate_profile.id,
        CandidateApplication.job_id == job.id,
    ).order_by(CandidateApplication.applied_at.desc()).first()

    try:
        offer = crud_offer.create_offer(db, create_data, offered_by=current_user["id"])
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Offer creation failed due to invalid candidate/job linkage. Verify candidate and job IDs.",
        )
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Offer creation failed due to a database error",
        )

    if offer.job and offer.job.budget_max:
        variance = ((offer.ctc_total - offer.job.budget_max) / offer.job.budget_max) * 100
        offer.variance_percent = round(variance, 2)
        offer.requires_approval = bool(variance > 0)
    else:
        offer.variance_percent = 0
        offer.requires_approval = False
    db.add(offer)

    if application:
        application.status = "offered"
        db.add(application)
    db.commit()
    db.refresh(offer)

    if offer.candidate and offer.candidate.user and offer.candidate.user.email:
        try:
            notification_service(db).send_candidate_event(
                event="offer_released",
                to_email=offer.candidate.user.email,
                candidate_name=offer.candidate.user.name or "Candidate",
                user_id=offer.candidate.user.id,
                candidate_id=offer.candidate_id,
                payload={
                    "job_title": offer.job.title if offer.job else "the role",
                    "offer_code": offer.offer_code,
                    "company": "HirePulse",
                },
            )
        except Exception:
            pass

    return {
        "id": offer.id,
        "candidate": offer.candidate.user.name if offer.candidate and offer.candidate.user else "",
        "role": offer.job.title if offer.job else "",
        "offerCode": offer.offer_code,
        "status": _enum_value(offer.status)
    }

@router.put("/offers/{offer_id}", response_model=Dict[str, Any])
async def update_offer_status(
    offer_id: int,
    status_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("recruiter"))
):
    """
    Update offer status
    
    Update the status of an existing offer
    """
    # Convert to schema
    update_data = OfferStatusUpdate(status=status_data["status"])
    
    offer = crud_offer.update_offer_status(db, offer_id, update_data)
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )

    latest_application = db.query(CandidateApplication).filter(
        CandidateApplication.candidate_id == offer.candidate_id,
        CandidateApplication.job_id == offer.job_id,
    ).order_by(CandidateApplication.applied_at.desc()).first()

    status_value = str(status_data["status"]).strip().lower()
    if status_value == "accepted":
        offer.accepted_at = datetime.utcnow()
        if latest_application:
            latest_application.status = "offered"
            db.add(latest_application)
    elif status_value == "joined":
        offer.joining_date = datetime.utcnow()
        other_benefits = dict(offer.other_benefits or {})
        joining_request = dict(other_benefits.get("joining_request") or {})
        joining_request["status"] = "approved"
        joining_request["approved_at"] = datetime.utcnow().isoformat()
        other_benefits["joining_request"] = joining_request
        offer.other_benefits = other_benefits
        if latest_application:
            latest_application.status = "joined"
            db.add(latest_application)
    elif status_value == "declined":
        if latest_application:
            latest_application.status = "rejected"
            db.add(latest_application)

    db.add(offer)
    db.commit()
    db.refresh(offer)

    if status_value in {"declined", "joined"} and offer.candidate and offer.candidate.user and offer.candidate.user.email:
        try:
            notification_service(db).send_candidate_event(
                event="joined" if status_value == "joined" else "rejected",
                to_email=offer.candidate.user.email,
                candidate_name=offer.candidate.user.name or "Candidate",
                user_id=offer.candidate.user.id,
                candidate_id=offer.candidate_id,
                payload={
                    "job_title": offer.job.title if offer.job else "the role",
                    "joining_date": offer.date_of_joining.isoformat() if offer.date_of_joining else "TBD",
                    "company": "HirePulse",
                },
            )
        except Exception:
            pass
    
    return {
        "id": offer.id,
        "candidate": offer.candidate.user.name if offer.candidate and offer.candidate.user else "",
        "role": offer.job.title if offer.job else "",
        "status": _enum_value(offer.status)
    }
