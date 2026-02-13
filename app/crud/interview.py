"""
CRUD operations for Interview models
"""
from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.interview import Interview, InterviewEvaluation
from app.schemas.interview import InterviewCreate, InterviewUpdate, InterviewEvaluationCreate

class CRUDInterview:
    # Interview operations
    def get_interview(self, db: Session, interview_id: int) -> Optional[Interview]:
        """Get interview by ID"""
        return db.query(Interview).filter(Interview.id == interview_id).first()
    
    def get_all_interviews(self, db: Session, skip: int = 0, limit: int = 100) -> List[Interview]:
        """Get all interviews"""
        return db.query(Interview).offset(skip).limit(limit).all()
    
    def get_interviews_by_candidate(self, db: Session, candidate_id: int) -> List[Interview]:
        """Get interviews by candidate"""
        return db.query(Interview).filter(Interview.candidate_id == candidate_id).all()
    
    def get_interviews_by_panel_member(self, db: Session, user_id: int) -> List[Interview]:
        """Get interviews where user is on panel"""
        from sqlalchemy import cast, String
        return db.query(Interview).filter(
            cast(Interview.panel_members, String).like(f'%{user_id}%')
        ).all()
    
    def create_interview(self, db: Session, interview_in: InterviewCreate) -> Interview:
        """Create an interview"""
        db_interview = Interview(**interview_in.dict())
        db.add(db_interview)
        db.commit()
        db.refresh(db_interview)
        return db_interview
    
    def update_interview(self, db: Session, interview_id: int, interview_in: InterviewUpdate) -> Optional[Interview]:
        """Update an interview"""
        db_interview = self.get_interview(db, interview_id)
        if not db_interview:
            return None
        
        update_data = interview_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_interview, field, value)
        
        db.add(db_interview)
        db.commit()
        db.refresh(db_interview)
        return db_interview
    
    def delete_interview(self, db: Session, interview_id: int) -> bool:
        """Delete an interview"""
        db_interview = self.get_interview(db, interview_id)
        if not db_interview:
            return False
        
        db.delete(db_interview)
        db.commit()
        return True
    
    # Interview Evaluation operations
    def get_evaluation(self, db: Session, evaluation_id: int) -> Optional[InterviewEvaluation]:
        """Get interview evaluation by ID"""
        return db.query(InterviewEvaluation).filter(InterviewEvaluation.id == evaluation_id).first()
    
    def get_evaluation_by_interview(self, db: Session, interview_id: int) -> Optional[InterviewEvaluation]:
        """Get evaluation by interview ID"""
        return db.query(InterviewEvaluation).filter(InterviewEvaluation.interview_id == interview_id).first()
    
    def create_evaluation(self, db: Session, evaluation_in: InterviewEvaluationCreate) -> InterviewEvaluation:
        """Create an interview evaluation"""
        db_evaluation = InterviewEvaluation(**evaluation_in.dict())
        db.add(db_evaluation)
        db.commit()
        db.refresh(db_evaluation)
        return db_evaluation

crud_interview = CRUDInterview()
