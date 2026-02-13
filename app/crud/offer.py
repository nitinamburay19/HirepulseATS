"""
CRUD operations for Offer models
"""
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from app.models.offer import Offer
from app.schemas.offer import OfferCreate, OfferUpdate, OfferStatusUpdate

class CRUDOffer:
    def get_offer(self, db: Session, offer_id: int) -> Optional[Offer]:
        """Get offer by ID"""
        return db.query(Offer).filter(Offer.id == offer_id).first()
    
    def get_offer_by_code(self, db: Session, offer_code: str) -> Optional[Offer]:
        """Get offer by code"""
        return db.query(Offer).filter(Offer.offer_code == offer_code).first()
    
    def get_all_offers(self, db: Session, skip: int = 0, limit: int = 100) -> List[Offer]:
        """Get all offers"""
        return db.query(Offer).offset(skip).limit(limit).all()
    
    def get_offers_by_candidate(self, db: Session, candidate_id: int) -> List[Offer]:
        """Get offers by candidate"""
        return db.query(Offer).filter(Offer.candidate_id == candidate_id).all()
    
    def get_offers_by_status(self, db: Session, status: str) -> List[Offer]:
        """Get offers by status"""
        return db.query(Offer).filter(Offer.status == status).all()
    
    def get_offers_requiring_approval(self, db: Session) -> List[Offer]:
        """Get offers that require approval"""
        return db.query(Offer).filter(Offer.requires_approval == True).all()
    
    def create_offer(self, db: Session, offer_in: OfferCreate, offered_by: int) -> Offer:
        """Create an offer"""
        # Calculate total CTC
        ctc_total = offer_in.ctc_fixed + offer_in.ctc_variable + offer_in.joining_bonus + offer_in.relocation_bonus
        
        db_offer = Offer(
            **offer_in.dict(),
            ctc_total=ctc_total,
            offered_by=offered_by,
            status="offered",
            offered_at=datetime.utcnow(),
        )
        db.add(db_offer)
        db.commit()
        db.refresh(db_offer)
        return db_offer
    
    def update_offer(self, db: Session, offer_id: int, offer_in: OfferUpdate) -> Optional[Offer]:
        """Update an offer"""
        db_offer = self.get_offer(db, offer_id)
        if not db_offer:
            return None
        
        update_data = offer_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_offer, field, value)
        
        # Recalculate total CTC if relevant fields changed
        if 'ctc_fixed' in update_data or 'ctc_variable' in update_data or 'joining_bonus' in update_data or 'relocation_bonus' in update_data:
            db_offer.ctc_total = db_offer.ctc_fixed + db_offer.ctc_variable + db_offer.joining_bonus + db_offer.relocation_bonus
        
        db.add(db_offer)
        db.commit()
        db.refresh(db_offer)
        return db_offer
    
    def update_offer_status(self, db: Session, offer_id: int, status_update: OfferStatusUpdate) -> Optional[Offer]:
        """Update offer status"""
        db_offer = self.get_offer(db, offer_id)
        if not db_offer:
            return None
        
        db_offer.status = status_update.status
        db.add(db_offer)
        db.commit()
        db.refresh(db_offer)
        return db_offer
    
    def approve_offer(self, db: Session, offer_id: int, approved_by: int) -> Optional[Offer]:
        """Approve an offer"""
        db_offer = self.get_offer(db, offer_id)
        if not db_offer:
            return None
        
        db_offer.requires_approval = False
        db_offer.approved_by = approved_by
        db.add(db_offer)
        db.commit()
        db.refresh(db_offer)
        return db_offer
    
    def delete_offer(self, db: Session, offer_id: int) -> bool:
        """Delete an offer"""
        db_offer = self.get_offer(db, offer_id)
        if not db_offer:
            return False
        
        db.delete(db_offer)
        db.commit()
        return True

crud_offer = CRUDOffer()
