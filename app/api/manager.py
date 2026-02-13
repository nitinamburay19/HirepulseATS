"""
Manager dashboard API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.utils.dependencies import require_any_role
from app.schemas.mpr import MPRCreate, MPRResponse
from app.schemas.interview import InterviewResponse
from app.crud.mpr import crud_mpr
from app.crud.interview import crud_interview
from app.models.interview import InterviewEvaluation
from app.services.manager import manager_service

router = APIRouter()


def _enum_value(value):
    return value.value if hasattr(value, "value") else value

@router.get("/stats/manager-dashboard", response_model=Dict[str, Any])
async def get_manager_stats(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_any_role(["manager", "admin"]))
):
    """
    Get manager dashboard statistics
    
    Fetch KPIs for the hiring manager hub
    """
    service = manager_service(db)
    return service.get_manager_stats(current_user["id"])

@router.get("/manager/pipeline", response_model=List[Dict[str, Any]])
async def get_manager_pipeline(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_any_role(["manager", "admin"]))
):
    """
    Get manager requisition pipeline
    
    Get pipeline stats for requisitions owned by the manager
    """
    service = manager_service(db)
    return service.get_manager_pipeline(current_user["id"])


@router.get("/manager/pipeline-candidates", response_model=List[Dict[str, Any]])
async def get_manager_pipeline_candidates(
    job_title: str,
    stage: str,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_any_role(["manager", "admin"]))
):
    """
    Get candidate drill-down for a manager pipeline stage.
    """
    service = manager_service(db)
    return service.get_pipeline_candidates(current_user["id"], job_title, stage)

@router.get("/mpr/my-requests", response_model=List[Dict[str, Any]])
async def get_my_mprs(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_any_role(["manager", "admin"]))
):
    """
    Get my MPRs
    
    Get a list of MPRs created by the manager
    """
    mprs = crud_mpr.get_mprs_by_manager(db, current_user["id"])
    return [
        {
            "id": mpr.id,
            "requisitionCode": mpr.requisition_code,
            "jobTitle": mpr.job_title,
            "department": mpr.department,
            "status": mpr.status,
            "positionsRequested": mpr.positions_requested,
            "positionsApproved": mpr.positions_approved,
            "createdAt": mpr.created_at.isoformat()
        }
        for mpr in mprs
    ]

@router.post("/mpr", response_model=Dict[str, Any])
async def create_mpr(
    mpr_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_any_role(["manager", "admin"]))
):
    """
    Create MPR
    
    Allow a manager to create a new Manpower requisition
    """
    import uuid
    
    # Generate requisition code
    requisition_code = f"MPR-{uuid.uuid4().hex[:8].upper()}"
    
    # Convert to schema
    create_data = MPRCreate(
        requisition_code=requisition_code,
        job_title=mpr_data["jobTitle"],
        job_description=mpr_data.get("jobDescription", ""),
        department=mpr_data["department"],
        hiring_manager_id=current_user["id"],
        hod_id=mpr_data.get("hodId"),
        job_type=mpr_data["jobType"],
        positions_requested=mpr_data.get("positionsRequested", 1),
        budget_min=mpr_data["budgetMin"],
        budget_max=mpr_data["budgetMax"],
        experience_required=mpr_data.get("experienceRequired", 0),
        skills_required=mpr_data.get("skillsRequired", []),
        justification=mpr_data.get("justification")
    )
    
    mpr = crud_mpr.create_mpr(db, create_data)
    return {
        "id": mpr.id,
        "jobTitle": mpr.job_title,
        "status": mpr.status,
        "requisitionCode": mpr.requisition_code
    }

@router.get("/manager/interviews", response_model=List[Dict[str, Any]])
async def get_my_interviews(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_any_role(["manager", "admin"]))
):
    """
    Get my interviews
    
    Get interviews where the manager is on the panel
    """
    service = manager_service(db)
    interviews = service.get_manager_interviews(current_user["id"])
    return [
        {
            "id": interview.id,
            "candidate": interview.candidate.user.name if interview.candidate and interview.candidate.user else "",
            "role": interview.job.title if interview.job else "",
            "time": interview.scheduled_time.isoformat(),
            "type": _enum_value(interview.round),
            "status": _enum_value(interview.status)
        }
        for interview in interviews
    ]

@router.post("/manager/interviews/feedback", response_model=Dict[str, Any])
async def submit_interview_feedback(
    feedback_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_any_role(["manager", "admin"]))
):
    """
    Submit interview feedback
    
    Submit feedback for an interview they conducted
    """
    interview_id = feedback_data.get("interviewId")
    if not interview_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="interviewId is required"
        )

    interview = crud_interview.get_interview(db, int(interview_id))
    if not interview:
        return {
            "message": "Success",
            "interviewId": int(interview_id),
            "feedbackId": None,
        }

    existing = crud_interview.get_evaluation_by_interview(db, int(interview_id))
    if existing:
        existing.overall_rating = int(feedback_data.get("rating", existing.overall_rating or 3))
        existing.outcome = str(feedback_data.get("outcome", existing.outcome or "hold"))
        existing.feedback = str(feedback_data.get("remarks", existing.feedback or ""))
        db.add(existing)
        feedback_id = existing.id
    else:
        evaluation = InterviewEvaluation(
            interview_id=interview.id,
            candidate_id=interview.candidate_id,
            evaluator_id=current_user["id"],
            overall_rating=int(feedback_data.get("rating", 3)),
            outcome=str(feedback_data.get("outcome", "hold")),
            feedback=str(feedback_data.get("remarks", "Feedback submitted by hiring manager.")),
        )
        db.add(evaluation)
        feedback_id = None

    # Keep interview pipeline state synchronized after manager evaluation submit.
    interview.status = "completed"
    db.add(interview)
    db.commit()

    if existing:
        db.refresh(existing)
        feedback_id = existing.id
    else:
        db.refresh(evaluation)
        feedback_id = evaluation.id

    return {
        "message": "Success",
        "interviewId": interview.id,
        "feedbackId": feedback_id
    }
