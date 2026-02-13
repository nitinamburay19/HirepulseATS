"""
CRUD operations for Blacklist model
"""
from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.blacklist import Blacklist
from app.schemas.blacklist import BlacklistCreate, BlacklistUpdate

class CRUDBlacklist:
    def get_blacklist_entry(self, db: Session, entry_id: int) -> Optional[Blacklist]:
        """Get blacklist entry by ID"""
        return db.query(Blacklist).filter(Blacklist.id == entry_id).first()
    
    def get_blacklist_by_email(self, db: Session, email: str) -> Optional[Blacklist]:
        """Get blacklist entry by email"""
        return db.query(Blacklist).filter(Blacklist.email == email, Blacklist.is_active == True).first()
    
    def get_blacklist_by_name(self, db: Session, name: str) -> List[Blacklist]:
        """Get blacklist entries by name"""
        return db.query(Blacklist).filter(Blacklist.name.ilike(f'%{name}%'), Blacklist.is_active == True).all()
    
    def get_all_blacklist(self, db: Session, skip: int = 0, limit: int = 100) -> List[Blacklist]:
        """Get all blacklist entries"""
        return db.query(Blacklist).filter(Blacklist.is_active == True).offset(skip).limit(limit).all()
    
    def create_blacklist_entry(self, db: Session, blacklist_in: BlacklistCreate) -> Blacklist:
        """Create a blacklist entry"""
        payload = blacklist_in.dict()
        risk = payload.get("risk_level")
        if hasattr(risk, "value"):
            payload["risk_level"] = str(risk.value).lower()
        elif isinstance(risk, str):
            payload["risk_level"] = risk.lower()
        db_entry = Blacklist(**payload)
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry
    
    def update_blacklist_entry(self, db: Session, entry_id: int, blacklist_in: BlacklistUpdate) -> Optional[Blacklist]:
        """Update a blacklist entry"""
        db_entry = self.get_blacklist_entry(db, entry_id)
        if not db_entry:
            return None
        
        update_data = blacklist_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_entry, field, value)
        
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry
    
    def remove_from_blacklist(self, db: Session, entry_id: int, removed_by: int) -> Optional[Blacklist]:
        """Remove an entry from blacklist"""
        db_entry = self.get_blacklist_entry(db, entry_id)
        if not db_entry:
            return None
        
        db_entry.is_active = False
        db_entry.removed_by = removed_by
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry
    
    def delete_blacklist_entry(self, db: Session, entry_id: int) -> bool:
        """Permanently delete a blacklist entry"""
        db_entry = self.get_blacklist_entry(db, entry_id)
        if not db_entry:
            return False
        
        db.delete(db_entry)
        db.commit()
        return True

crud_blacklist = CRUDBlacklist()
