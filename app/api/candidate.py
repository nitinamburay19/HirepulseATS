"""
Candidate portal API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import shutil
import os
from app.database import get_db
from app.utils.dependencies import get_current_user, require_role
from app.schemas.candidate import CandidateProfileUpdate, CandidateDocumentResponse
from app.schemas.candidate import CandidateProfileCreate
from app.crud.candidate import crud_candidate
from app.crud.job import crud_job
from app.crud.offer import crud_offer
from app.services.candidate import candidate_service
from app.services.notifications import notification_service
from typing import List, Dict, Any, Optional
from datetime import datetime


router = APIRouter()

# Ensure upload directory exists
UPLOAD_DIR = "uploads/candidate_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _get_or_create_candidate_profile(db: Session, current_user: Dict[str, Any]):
    candidate = crud_candidate.get_profile_by_user_id(db, current_user["id"])
    if candidate:
        return candidate

    profile = CandidateProfileCreate(user_id=current_user["id"])
    return crud_candidate.create_profile(db, profile)

@router.get("/jobs/public", response_model=List[Dict[str, Any]])
async def get_public_job_board(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get public job board
    
    Get all OPEN jobs for public viewing
    """
    jobs = crud_job.get_public_jobs(db, skip=skip, limit=limit)
    return [
        {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "department": job.department,
            "location": job.location,
            "jobType": job.job_type,
            "experienceRequired": job.experience_required,
            "skillsRequired": job.skills_required or [],
            "postedAt": job.posted_at.isoformat() if job.posted_at else None
        }
        for job in jobs
    ]

@router.post("/jobs/{job_id}/apply", response_model=Dict[str, Any])
async def apply_for_job(
    job_id: int,
    application_data: Optional[Dict[str, Any]] = None,
    auto_fill: bool = True,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("candidate"))
):
    """
    Apply for job
    
    Submit a full application for a specific job
    Can auto-fill from profile and resume
    """
    # Get candidate profile
    candidate = _get_or_create_candidate_profile(db, current_user)
    
    # Check if already applied
    existing_apps = crud_candidate.get_applications_by_candidate(db, candidate.id)
    for app in existing_apps:
        if app.job_id == job_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already applied for this job"
            )
    
    # Auto-fill application data and merge explicit application payload (if provided)
    if auto_fill:
        service = candidate_service(db)
        auto_fill_result = service.auto_fill_application(candidate.id, job_id)
        
        if auto_fill_result.get("success"):
            base_application_data = auto_fill_result["application_data"] or {}
            match_score = auto_fill_result["match_score"]
        else:
            # If auto-fill fails, create empty application
            base_application_data = {
                "personal_info": {
                    "name": candidate.user.name if candidate.user else "",
                    "email": candidate.user.email if candidate.user else "",
                    "phone": candidate.phone or ""
                },
                "professional": {
                    "skills": candidate.skills or [],
                    "experience_years": candidate.experience_years or 0
                },
                "education": [],
                "work_experience": []
            }
            match_score = 0

        if application_data:
            merged_data = dict(base_application_data)
            for key, value in application_data.items():
                if isinstance(value, dict) and isinstance(merged_data.get(key), dict):
                    merged_section = dict(merged_data.get(key) or {})
                    merged_section.update(value)
                    merged_data[key] = merged_section
                else:
                    merged_data[key] = value
            application_data = merged_data
        else:
            application_data = base_application_data
    else:
        if not application_data:
            application_data = {
                "personal_info": {},
                "professional": {},
                "education": [],
                "work_experience": [],
            }
        match_score = 0
    
    # Create application
    from app.models.candidate import CandidateApplication
    screening_score = _generate_ai_screening_score(application_data, job_id, db)

    db_application = CandidateApplication(
        candidate_id=candidate.id,
        job_id=job_id,
        application_data=application_data,
        status="applied",
        ai_score=int(screening_score) if screening_score else (int(match_score) if match_score else None)
    )
    db.add(db_application)
    db.commit()
    db.refresh(db_application)

    if candidate.user and candidate.user.email:
        try:
            notification_service(db).send_candidate_event(
                event="application_submitted",
                to_email=candidate.user.email,
                candidate_name=candidate.user.name or "Candidate",
                user_id=candidate.user_id,
                candidate_id=candidate.id,
                payload={
                    "job_title": db_application.job.title if db_application.job else "the role",
                    "company": "HirePulse",
                },
            )
        except Exception:
            pass
    
    return {
        "applicationId": db_application.id,
        "status": "submitted",
        "message": "Application submitted successfully",
        "autoFilled": auto_fill,
        "matchScore": match_score,
        "screeningScore": screening_score,
        "nextSteps": [
            "Resume will be reviewed by our AI system",
            "You'll be notified about interview invitations",
            "Check your application status in the portal"
        ]
    }

def _generate_ai_screening_score(application_data: Dict, job_id: int, db: Session) -> int:
    """Generate deterministic screening score from application payload quality."""
    professional = application_data.get("professional", {}) if isinstance(application_data, dict) else {}
    skills = professional.get("skills") if isinstance(professional, dict) else []
    experience_years = professional.get("experience_years", 0) if isinstance(professional, dict) else 0

    skill_count = len(skills) if isinstance(skills, list) else 0
    try:
        experience_value = int(experience_years or 0)
    except (TypeError, ValueError):
        experience_value = 0

    base_score = 50 + min(skill_count, 8) * 5 + min(experience_value, 10) * 3
    return max(0, min(base_score, 100))

@router.get("/candidate/profile", response_model=Dict[str, Any])
async def get_my_profile(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("candidate"))
):
    """
    Get my profile
    
    Fetch the profile data for the logged-in candidate
    """
    service = candidate_service(db)
    
    # Get candidate ID from user ID
    candidate = _get_or_create_candidate_profile(db, current_user)
    
    return service.get_candidate_profile(candidate.id)

@router.put("/candidate/profile", response_model=Dict[str, Any])
async def update_my_profile(
    profile_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("candidate"))
):
    """
    Update my profile
    
    Update the candidate's own profile
    """
    # Get candidate profile
    candidate = _get_or_create_candidate_profile(db, current_user)

    if profile_data.get("name") and candidate.user:
        candidate.user.name = str(profile_data.get("name")).strip()
        db.add(candidate.user)
        db.commit()
        db.refresh(candidate.user)
    
    # Convert to schema
    update_data = CandidateProfileUpdate(
        name=profile_data.get("name"),
        skills=profile_data.get("skills"),
        phone=profile_data.get("phone"),
        address=profile_data.get("address"),
        city=profile_data.get("city"),
        country=profile_data.get("country"),
        experience_years=profile_data.get("experienceYears"),
        current_company=profile_data.get("currentCompany"),
        current_position=profile_data.get("currentPosition"),
        expected_ctc=profile_data.get("expectedCtc"),
        notice_period=profile_data.get("noticePeriod")
    )
    
    updated_profile = crud_candidate.update_profile(db, candidate.id, update_data)
    if not updated_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile update failed"
        )
    
    return {
        "name": updated_profile.user.name if updated_profile.user else current_user["name"],
        "role": current_user["role"],
        "skills": updated_profile.skills or []
    }

@router.post("/candidate/documents/upload", response_model=Dict[str, Any])
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = "resume",
    parse_resume: bool = True,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("candidate"))
):
    """
    Upload a new document (e.g., resume, ID proof)
    
    If document_type is 'resume' and parse_resume is True, 
    automatically parse and update candidate profile
    """
    # Get candidate profile
    candidate = _get_or_create_candidate_profile(db, current_user)
    
    # Create upload directory if it doesn't exist
    UPLOAD_DIR = f"uploads/candidate_{candidate.id}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    import uuid
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{file_extension}"
    file_location = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create document record
    from app.models.candidate import CandidateDocument
    db_document = CandidateDocument(
        candidate_id=candidate.id,
        document_type=document_type,
        document_url=f"/uploads/candidate_{candidate.id}/{unique_filename}",
        file_name=file.filename,
        file_size=os.path.getsize(file_location)
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    if document_type == "resume":
        candidate.resume_url = db_document.document_url
        db.add(candidate)
        db.commit()
    
    response = {
        "documentUrl": db_document.document_url,
        "name": db_document.file_name,
        "type": db_document.document_type,
        "status": "uploaded",
        "id": db_document.id,
        "parsed": False
    }
    
    # Parse resume if requested
    if document_type == "resume" and parse_resume:
        try:
            service = candidate_service(db)
            parse_result = service.parse_and_update_profile(candidate.id, file_location)
            
            if parse_result.get("success"):
                db_document.verified = True
                db.add(db_document)
                db.commit()
                db.refresh(db_document)
                response["parsed"] = True
                response["parse_result"] = {
                    "updates_applied": parse_result.get("updates_applied", []),
                    "skills_extracted": len(parse_result.get("parsed_data", {}).get("skills", [])),
                    "experience_extracted": parse_result.get("parsed_data", {}).get("experience", 0)
                }
                response["message"] = "Resume parsed successfully. Profile updated with extracted information."
            else:
                response["parse_error"] = parse_result.get("error")
                response["message"] = "Resume uploaded but parsing failed."
        
        except Exception as e:
            response["parse_error"] = str(e)
            response["message"] = "Resume uploaded but parsing encountered an error."
    
    return response


@router.delete("/candidate/documents/{document_id}", response_model=Dict[str, Any])
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("candidate"))
):
    """
    Delete candidate document

    Remove a document uploaded by the logged-in candidate.
    """
    candidate = _get_or_create_candidate_profile(db, current_user)
    document = crud_candidate.get_document(db, document_id)
    if not document or document.candidate_id != candidate.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    file_location = str(document.document_url or "").replace("/uploads/", "uploads/")
    if file_location and os.path.exists(file_location):
        try:
            os.remove(file_location)
        except OSError:
            pass

    if str(document.document_type).lower().startswith("resume") and candidate.resume_url == document.document_url:
        candidate.resume_url = None
        db.add(candidate)

    deleted = crud_candidate.delete_document(db, document_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document"
        )

    return {"message": "Document deleted successfully", "id": document_id}

@router.get("/candidate/application-status", response_model=Dict[str, Any])
async def get_my_application_status(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("candidate"))
):
    """
    Get my application status
    
    Get the detailed pipeline status for the candidate's active application
    """
    service = candidate_service(db)
    
    # Get candidate ID from user ID
    candidate = _get_or_create_candidate_profile(db, current_user)
    
    return service.get_application_status(candidate.id)


@router.put("/candidate/offers/{offer_id}/decision", response_model=Dict[str, Any])
async def decide_offer(
    offer_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("candidate")),
):
    """
    Candidate offer decision

    Allows a candidate to accept or decline their own offer.
    """
    candidate = _get_or_create_candidate_profile(db, current_user)
    offer = crud_offer.get_offer(db, offer_id)
    if not offer or offer.candidate_id != candidate.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found",
        )

    decision = str(payload.get("decision", "")).strip().lower()
    if decision not in {"accepted", "declined"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="decision must be either 'accepted' or 'declined'",
        )

    current_status = str(offer.status.value if hasattr(offer.status, "value") else offer.status).lower()
    if current_status == "joined":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Offer already finalized as joined",
        )

    offer.status = decision
    if decision == "accepted":
        offer.accepted_at = datetime.utcnow()

    from app.models.candidate import CandidateApplication
    latest_application = db.query(CandidateApplication).filter(
        CandidateApplication.candidate_id == candidate.id,
        CandidateApplication.job_id == offer.job_id,
    ).order_by(CandidateApplication.applied_at.desc()).first()
    if latest_application:
        latest_application.status = "offered" if decision == "accepted" else "rejected"
        db.add(latest_application)

    db.add(offer)
    db.commit()
    db.refresh(offer)

    return {
        "id": offer.id,
        "status": str(offer.status.value if hasattr(offer.status, "value") else offer.status).lower(),
        "message": "Offer decision recorded successfully",
    }


@router.post("/candidate/offers/{offer_id}/join-request", response_model=Dict[str, Any])
async def request_joining_confirmation(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("candidate")),
):
    """
    Candidate join request

    Candidate requests recruiter confirmation for joined status.
    """
    candidate = _get_or_create_candidate_profile(db, current_user)
    offer = crud_offer.get_offer(db, offer_id)
    if not offer or offer.candidate_id != candidate.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found",
        )

    offer_status = str(offer.status.value if hasattr(offer.status, "value") else offer.status).lower()
    if offer_status != "accepted":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Joining request is allowed only after offer is accepted",
        )

    other_benefits = dict(offer.other_benefits or {})
    joining_request = dict(other_benefits.get("joining_request") or {})
    joining_request["status"] = "pending"
    joining_request["requested_at"] = datetime.utcnow().isoformat()
    other_benefits["joining_request"] = joining_request
    offer.other_benefits = other_benefits

    db.add(offer)
    db.commit()
    db.refresh(offer)

    return {
        "id": offer.id,
        "joinRequest": joining_request,
        "message": "Joining confirmation request sent to recruiter",
    }

@router.post("/candidate/resume/parse/{document_id}", response_model=Dict[str, Any])
async def parse_resume(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("candidate"))
):
    """
    Parse an uploaded resume document and update profile
    """
    # Get candidate profile
    candidate = _get_or_create_candidate_profile(db, current_user)
    
    # Get document
    document = crud_candidate.get_document(db, document_id)
    if not document or document.candidate_id != candidate.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if document.document_type != "resume":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document is not a resume"
        )
    
    # Get file path
    file_location = document.document_url.replace("/uploads/", "uploads/")
    if not os.path.exists(file_location):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found"
        )
    
    # Parse resume
    service = candidate_service(db)
    parse_result = service.parse_and_update_profile(candidate.id, file_location)
    
    if not parse_result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse resume: {parse_result.get('error')}"
        )

    document.verified = True
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return {
        "success": True,
        "message": "Resume parsed successfully",
        "updates_applied": parse_result.get("updates_applied", []),
        "extracted_data": {
            "skills_count": len(parse_result.get("parsed_data", {}).get("skills", [])),
            "experience_years": parse_result.get("parsed_data", {}).get("experience", 0),
            "education_count": len(parse_result.get("parsed_data", {}).get("education", [])),
            "companies_count": len(parse_result.get("parsed_data", {}).get("companies", []))
        }
    }

@router.get("/candidate/resume/suggestions/{job_id}", response_model=Dict[str, Any])
async def get_resume_suggestions(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("candidate"))
):
    """
    Get suggestions for improving resume for a specific job
    """
    # Get candidate profile
    candidate = _get_or_create_candidate_profile(db, current_user)
    
    # Get job
    job = crud_job.get_job(db, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    service = candidate_service(db)
    parsed_data = service.get_latest_parsed_resume_data(candidate.id)
    
    # Get suggestions
    suggestions = service._get_application_suggestions(candidate, parsed_data, job)
    
    # Calculate match score
    match_score = service._calculate_job_match(candidate, parsed_data, job)
    
    # Get missing keywords
    required_skills = set([s.lower() for s in job.skills_required or []])
    candidate_skills = set([s.lower() for s in candidate.skills or []])
    missing_keywords = list(required_skills - candidate_skills)
    
    return {
        "job_title": job.title,
        "match_score": round(match_score, 1),
        "suggestions": suggestions,
        "missing_keywords": missing_keywords[:10],
        "has_resume": parsed_data is not None,
        "recommended_skills_to_add": missing_keywords[:5]
    }

@router.get("/jobs/{job_id}/auto-fill", response_model=Dict[str, Any])
async def auto_fill_application(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("candidate"))
):
    """
    Auto-fill job application with candidate profile and resume data
    """
    # Get candidate profile
    candidate = _get_or_create_candidate_profile(db, current_user)
    
    service = candidate_service(db)
    result = service.auto_fill_application(candidate.id, job_id)
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error")
        )
    
    return result

@router.get("/candidate/resume/parsed-data", response_model=Dict[str, Any])
async def get_parsed_resume_data(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("candidate"))
):
    """
    Get parsed data from the candidate's resume
    """
    # Get candidate profile
    candidate = _get_or_create_candidate_profile(db, current_user)
    
    service = candidate_service(db)
    parsed_data = service.get_latest_parsed_resume_data(candidate.id)

    if not parsed_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No parsed resume data found. Upload and parse a resume first."
        )

    # Remove raw text for privacy/performance
    if "raw_text" in parsed_data:
        del parsed_data["raw_text"]

    documents = crud_candidate.get_documents_by_candidate(db, candidate.id)
    
    return {
        "parsed_data": parsed_data,
        "resume_count": len([d for d in documents if d.document_type == "resume"]),
        "last_updated": documents[0].uploaded_at.isoformat() if documents else None
    }
