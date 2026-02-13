"""
CRUD operations for MPR models
"""
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.models.mpr import MPR, MPRConfig
from app.schemas.mpr import MPRCreate, MPRUpdate, MPRConfigUpdate

class CRUDMPR:
    # MPR operations
    def get_mpr(self, db: Session, mpr_id: int) -> Optional[MPR]:
        """Get MPR by ID"""
        return db.query(MPR).filter(MPR.id == mpr_id).first()
    
    def get_mpr_by_code(self, db: Session, requisition_code: str) -> Optional[MPR]:
        """Get MPR by requisition code"""
        return db.query(MPR).filter(MPR.requisition_code == requisition_code).first()
    
    def get_all_mprs(self, db: Session, skip: int = 0, limit: int = 100) -> List[MPR]:
        """Get all MPRs"""
        return db.query(MPR).offset(skip).limit(limit).all()
    
    def get_mprs_by_manager(self, db: Session, manager_id: int) -> List[MPR]:
        """Get MPRs by hiring manager"""
        return db.query(MPR).filter(MPR.hiring_manager_id == manager_id).all()
    
    def create_mpr(self, db: Session, mpr_in: MPRCreate) -> MPR:
        """Create an MPR"""
        db_mpr = MPR(**mpr_in.dict())
        db.add(db_mpr)
        db.commit()
        db.refresh(db_mpr)
        return db_mpr
    
    def update_mpr(self, db: Session, mpr_id: int, mpr_in: MPRUpdate) -> Optional[MPR]:
        """Update an MPR"""
        db_mpr = self.get_mpr(db, mpr_id)
        if not db_mpr:
            return None
        
        update_data = mpr_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_mpr, field, value)
        
        db.add(db_mpr)
        db.commit()
        db.refresh(db_mpr)
        return db_mpr
    
    def update_mpr_status(self, db: Session, mpr_id: int, status: str) -> Optional[MPR]:
        """Update MPR status"""
        db_mpr = self.get_mpr(db, mpr_id)
        if not db_mpr:
            return None
        
        db_mpr.status = status
        db.add(db_mpr)
        db.commit()
        db.refresh(db_mpr)
        return db_mpr
    
    def update_pipeline_stats(self, db: Session, mpr_id: int, stats: Dict[str, Any]) -> Optional[MPR]:
        """Update MPR pipeline statistics"""
        db_mpr = self.get_mpr(db, mpr_id)
        if not db_mpr:
            return None
        
        db_mpr.pipeline_stats = stats
        db.add(db_mpr)
        db.commit()
        db.refresh(db_mpr)
        return db_mpr
    
    def delete_mpr(self, db: Session, mpr_id: int) -> bool:
        """Delete an MPR"""
        db_mpr = self.get_mpr(db, mpr_id)
        if not db_mpr:
            return False
        
        db.delete(db_mpr)
        db.commit()
        return True
    
    # MPR Config operations
    def get_config(self, db: Session) -> Optional[MPRConfig]:
        """Get MPR configuration"""
        return db.query(MPRConfig).first()
    
    def create_config(self, db: Session, config_in: MPRConfigUpdate) -> MPRConfig:
        """Create MPR configuration"""
        db_config = MPRConfig(**config_in.dict())
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
        return db_config
    
    def update_config(self, db: Session, config_in: MPRConfigUpdate, updated_by: int) -> Optional[MPRConfig]:
        """Update MPR configuration"""
        db_config = self.get_config(db)
        if not db_config:
            # Create if doesn't exist
            return self.create_config(db, config_in)
        
        update_data = config_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_config, field, value)
        
        db_config.updated_by = updated_by
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
        return db_config

crud_mpr = CRUDMPR()