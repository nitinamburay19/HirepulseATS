"""
Interview models
"""
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, validates
from app.database import Base
from sqlalchemy import Enum
import enum
from datetime import datetime

class InterviewStatus(str, enum.Enum):
    """Interview status enumeration"""
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class InterviewRound(str, enum.Enum):
    """Interview round enumeration"""
    SCREENING = "screening"
    TECHNICAL_1 = "technical_1"
    TECHNICAL_2 = "technical_2"
    MANAGERIAL = "managerial"
    HR = "hr"
    FINAL = "final"

class InterviewMode(str, enum.Enum):
    """Interview mode enumeration"""
    IN_PERSON = "in_person"
    VIDEO_CALL = "video_call"
    PHONE_CALL = "phone_call"

class Interview(Base):
    """Interview scheduling model"""
    
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    round = Column(
        Enum(InterviewRound, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, default=60)
    mode = Column(
        Enum(InterviewMode, values_callable=lambda x: [e.value for e in x]),
        default=InterviewMode.VIDEO_CALL.value
    )
    status = Column(
        Enum(InterviewStatus, values_callable=lambda x: [e.value for e in x]),
        default=InterviewStatus.SCHEDULED.value
    )
    meeting_link = Column(String, nullable=True)
    location = Column(String, nullable=True)
    panel_members = Column(JSON, default=list)  # JSON array of user IDs
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    candidate = relationship("Candidate")
    job = relationship("Job")
    creator = relationship("User", foreign_keys=[created_by])
    evaluation = relationship("InterviewEvaluation", uselist=False, back_populates="interview")

    @validates("scheduled_time")
    def _coerce_scheduled_time(self, key, value):
        if isinstance(value, str):
            normalized = value.replace("Z", "+00:00")
            try:
                return datetime.fromisoformat(normalized)
            except ValueError:
                return value
        return value

class InterviewEvaluation(Base):
    """Interview evaluation and feedback"""
    
    __tablename__ = "interview_evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), unique=True, nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    evaluator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    technical_rating = Column(Integer, nullable=True)  # 1-5 scale
    communication_rating = Column(Integer, nullable=True)  # 1-5 scale
    cultural_fit_rating = Column(Integer, nullable=True)  # 1-5 scale
    overall_rating = Column(Integer, nullable=False)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    outcome = Column(String, nullable=False)  # pass, fail, hold
    recommendation = Column(String, nullable=True)  # hire, reject, next_round
    feedback = Column(Text, nullable=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="evaluation")
    candidate = relationship("Candidate")
    evaluator = relationship("User")
