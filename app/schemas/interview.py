"""
Pydantic schemas for Interview models
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class InterviewRound(str, Enum):
    SCREENING = "screening"
    TECHNICAL_1 = "technical_1"
    TECHNICAL_2 = "technical_2"
    MANAGERIAL = "managerial"
    HR = "hr"
    FINAL = "final"

class InterviewMode(str, Enum):
    IN_PERSON = "in_person"
    VIDEO_CALL = "video_call"
    PHONE_CALL = "phone_call"

class InterviewStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class InterviewBase(BaseModel):
    candidate_id: int
    job_id: Optional[int] = None
    round: InterviewRound
    scheduled_time: datetime
    duration_minutes: int = 60
    mode: InterviewMode = InterviewMode.VIDEO_CALL
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    panel_members: List[int] = []
    notes: Optional[str] = None

class InterviewCreate(InterviewBase):
    created_by: int

class InterviewUpdate(BaseModel):
    scheduled_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    mode: Optional[InterviewMode] = None
    status: Optional[InterviewStatus] = None
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    panel_members: Optional[List[int]] = None
    notes: Optional[str] = None

class InterviewResponse(InterviewBase):
    id: int
    status: InterviewStatus
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class InterviewEvaluationBase(BaseModel):
    interview_id: int
    candidate_id: int
    evaluator_id: int
    technical_rating: Optional[int] = None
    communication_rating: Optional[int] = None
    cultural_fit_rating: Optional[int] = None
    overall_rating: int
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    outcome: str
    recommendation: Optional[str] = None
    feedback: str

class InterviewEvaluationCreate(InterviewEvaluationBase):
    pass

class InterviewEvaluationResponse(InterviewEvaluationBase):
    id: int
    submitted_at: datetime
    
    class Config:
        from_attributes = True