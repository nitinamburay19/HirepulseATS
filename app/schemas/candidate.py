"""
Pydantic schemas for Candidate models
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Candidate Profile
class CandidateProfileBase(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    skills: List[str] = []
    experience_years: int = 0
    current_company: Optional[str] = None
    current_position: Optional[str] = None
    expected_ctc: Optional[int] = None
    notice_period: Optional[int] = None

class CandidateProfileCreate(CandidateProfileBase):
    user_id: int

class CandidateProfileUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[int] = None
    current_company: Optional[str] = None
    current_position: Optional[str] = None
    expected_ctc: Optional[int] = None
    notice_period: Optional[int] = None

class CandidateProfileResponse(CandidateProfileBase):
    id: int
    user_id: int
    resume_url: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Candidate Application
class CandidateApplicationBase(BaseModel):
    candidate_id: int
    job_id: int
    application_data: Optional[Dict[str, Any]] = None

class CandidateApplicationCreate(CandidateApplicationBase):
    pass

class CandidateApplicationUpdate(BaseModel):
    status: Optional[str] = None
    ai_score: Optional[int] = None
    screening_notes: Optional[str] = None

class CandidateApplicationResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    status: str
    ai_score: Optional[int]
    screening_notes: Optional[str]
    applied_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Candidate Document
class CandidateDocumentBase(BaseModel):
    candidate_id: int
    document_type: str
    file_name: str
    file_size: Optional[int] = None

class CandidateDocumentCreate(CandidateDocumentBase):
    document_url: str

class CandidateDocumentResponse(BaseModel):
    id: int
    candidate_id: int
    document_type: str
    document_url: str
    file_name: str
    file_size: Optional[int]
    verified: bool
    uploaded_at: datetime
    
    class Config:
        from_attributes = True