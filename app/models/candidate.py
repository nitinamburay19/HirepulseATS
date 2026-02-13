"""
Candidate models for candidate portal
"""
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Candidate(Base):
    """Candidate profile model"""
    
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    skills = Column(JSON, default=list)  # JSON array of skills
    experience_years = Column(Integer, default=0)
    current_company = Column(String, nullable=True)
    current_position = Column(String, nullable=True)
    expected_ctc = Column(Integer, nullable=True)
    notice_period = Column(Integer, nullable=True)
    resume_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="candidate_profile")
    documents = relationship("CandidateDocument", back_populates="candidate")
    applications = relationship("CandidateApplication", back_populates="candidate")

class CandidateDocument(Base):
    """Candidate documents (resume, ID proofs, etc.)"""
    
    __tablename__ = "candidate_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    document_type = Column(String, nullable=False)  # 'resume', 'id_proof', 'certificate', etc.
    document_url = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    verified = Column(Boolean, default=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    candidate = relationship("Candidate", back_populates="documents")

class CandidateApplication(Base):
    """Candidate job applications"""
    
    __tablename__ = "candidate_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    status = Column(String, default="applied")  # applied, screening, interview, rejected, offered
    application_data = Column(JSON, nullable=True)  # Full application form data
    ai_score = Column(Integer, nullable=True)  # AI screening score
    screening_notes = Column(Text, nullable=True)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    candidate = relationship("Candidate", back_populates="applications")
    job = relationship("Job", back_populates="applications")
