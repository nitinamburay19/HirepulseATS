"""
CRUD operations for Agency models
"""
from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.agency import Agency, AgencySubmission
from app.schemas.agency import AgencyCreate, AgencyUpdate, AgencySubmissionCreate

class CRUDAgency:
    # Agency operations
    def get_agency(self, db: Session, agency_id: int) -> Optional[Agency]:
        """Get agency by ID"""
        return db.query(Agency).filter(Agency.id == agency_id).first()
    
    def get_agency_by_name(self, db: Session, name: str) -> Optional[Agency]:
        """Get agency by name"""
        return db.query(Agency).filter(Agency.name == name).first()
    
    def get_all_agencies(self, db: Session, skip: int = 0, limit: int = 100) -> List[Agency]:
        """Get all agencies"""
        return db.query(Agency).offset(skip).limit(limit).all()
    
    def create_agency(self, db: Session, agency_in: AgencyCreate) -> Agency:
        """Create an agency"""
        payload = agency_in.dict()
        for field in ("tier", "status"):
            value = payload.get(field)
            if hasattr(value, "value"):
                payload[field] = str(value.value).lower()
            elif isinstance(value, str):
                payload[field] = value.lower()
        db_agency = Agency(**payload)
        db.add(db_agency)
        db.commit()
        db.refresh(db_agency)
        return db_agency
    
    def update_agency(self, db: Session, agency_id: int, agency_in: AgencyUpdate) -> Optional[Agency]:
        """Update an agency"""
        db_agency = self.get_agency(db, agency_id)
        if not db_agency:
            return None
        
        update_data = agency_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field in {"tier", "status"}:
                if hasattr(value, "value"):
                    value = str(value.value).lower()
                elif isinstance(value, str):
                    value = value.lower()
            setattr(db_agency, field, value)
        
        db.add(db_agency)
        db.commit()
        db.refresh(db_agency)
        return db_agency
    
    def update_agency_status(self, db: Session, agency_id: int, status: str) -> Optional[Agency]:
        """Update agency status"""
        db_agency = self.get_agency(db, agency_id)
        if not db_agency:
            return None
        
        db_agency.status = status
        db.add(db_agency)
        db.commit()
        db.refresh(db_agency)
        return db_agency
    
    def delete_agency(self, db: Session, agency_id: int) -> bool:
        """Delete an agency"""
        db_agency = self.get_agency(db, agency_id)
        if not db_agency:
            return False
        
        db.delete(db_agency)
        db.commit()
        return True
    
    # Agency Submission operations
    def get_submission(self, db: Session, submission_id: int) -> Optional[AgencySubmission]:
        """Get agency submission by ID"""
        return db.query(AgencySubmission).filter(AgencySubmission.id == submission_id).first()
    
    def get_submissions_by_agency(self, db: Session, agency_id: int) -> List[AgencySubmission]:
        """Get all submissions by agency"""
        return db.query(AgencySubmission).filter(AgencySubmission.agency_id == agency_id).all()
    
    def create_submission(self, db: Session, submission_in: AgencySubmissionCreate) -> AgencySubmission:
        """Create an agency submission"""
        db_submission = AgencySubmission(**submission_in.dict())
        db.add(db_submission)
        db.commit()
        db.refresh(db_submission)
        return db_submission

crud_agency = CRUDAgency()
