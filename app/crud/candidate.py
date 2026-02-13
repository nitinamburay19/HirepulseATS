"""
CRUD operations for Candidate models
"""
from sqlalchemy.orm import Session
from typing import Optional, List, Union, Dict, Any
from app.models.candidate import Candidate, CandidateDocument, CandidateApplication
from app.schemas.candidate import (
    CandidateProfileCreate, CandidateProfileUpdate,
    CandidateDocumentCreate, CandidateApplicationCreate, CandidateApplicationUpdate
)

class CRUDCandidate:
    # Candidate Profile operations
    def get_profile(self, db: Session, candidate_id: int) -> Optional[Candidate]:
        """Get candidate profile by ID"""
        return db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    def get_profile_by_user_id(self, db: Session, user_id: int) -> Optional[Candidate]:
        """Get candidate profile by user ID"""
        return db.query(Candidate).filter(Candidate.user_id == user_id).first()
    
    def get_all_profiles(self, db: Session, skip: int = 0, limit: int = 100) -> List[Candidate]:
        """Get all candidate profiles"""
        return db.query(Candidate).offset(skip).limit(limit).all()
    
    def create_profile(self, db: Session, profile_in: CandidateProfileCreate) -> Candidate:
        """Create a candidate profile"""
        db_profile = Candidate(**profile_in.dict())
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return db_profile
    
    def update_profile(
        self,
        db: Session,
        candidate_id: int,
        profile_in: Union[CandidateProfileUpdate, Dict[str, Any]],
    ) -> Optional[Candidate]:
        """Update candidate profile"""
        db_profile = self.get_profile(db, candidate_id)
        if not db_profile:
            return None
        
        if isinstance(profile_in, dict):
            update_data = {k: v for k, v in profile_in.items() if v is not None}
        else:
            update_data = profile_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_profile, field, value)
        
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return db_profile
    
    # Candidate Document operations
    def get_document(self, db: Session, document_id: int) -> Optional[CandidateDocument]:
        """Get candidate document by ID"""
        return db.query(CandidateDocument).filter(CandidateDocument.id == document_id).first()
    
    def get_documents_by_candidate(self, db: Session, candidate_id: int) -> List[CandidateDocument]:
        """Get all documents for a candidate"""
        return db.query(CandidateDocument).filter(CandidateDocument.candidate_id == candidate_id).all()
    
    def create_document(self, db: Session, document_in: CandidateDocumentCreate) -> CandidateDocument:
        """Create a candidate document"""
        db_document = CandidateDocument(**document_in.dict())
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        return db_document
    
    def delete_document(self, db: Session, document_id: int) -> bool:
        """Delete a candidate document"""
        db_document = self.get_document(db, document_id)
        if not db_document:
            return False
        
        db.delete(db_document)
        db.commit()
        return True
    
    # Candidate Application operations
    def get_application(self, db: Session, application_id: int) -> Optional[CandidateApplication]:
        """Get candidate application by ID"""
        return db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
    
    def get_applications_by_candidate(self, db: Session, candidate_id: int) -> List[CandidateApplication]:
        """Get all applications for a candidate"""
        return db.query(CandidateApplication).filter(CandidateApplication.candidate_id == candidate_id).all()
    
    def get_applications_by_job(self, db: Session, job_id: int) -> List[CandidateApplication]:
        """Get all applications for a job"""
        return db.query(CandidateApplication).filter(CandidateApplication.job_id == job_id).all()
    
    def create_application(self, db: Session, application_in: CandidateApplicationCreate) -> CandidateApplication:
        """Create a candidate application"""
        db_application = CandidateApplication(**application_in.dict())
        db.add(db_application)
        db.commit()
        db.refresh(db_application)
        return db_application
    
    def update_application(self, db: Session, application_id: int, application_in: CandidateApplicationUpdate) -> Optional[CandidateApplication]:
        """Update candidate application"""
        db_application = self.get_application(db, application_id)
        if not db_application:
            return None
        
        update_data = application_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_application, field, value)
        
        db.add(db_application)
        db.commit()
        db.refresh(db_application)
        return db_application

crud_candidate = CRUDCandidate()
