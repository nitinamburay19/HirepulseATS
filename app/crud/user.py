"""
CRUD operations for User model
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password
from datetime import datetime

class CRUDUser:
    def get(self, db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    def get_by_employee_code(self, db: Session, employee_code: str) -> Optional[User]:
        """Get user by employee code"""
        return db.query(User).filter(User.employee_code == employee_code).first()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100, include_inactive: bool = False) -> List[User]:
        """Get all users with pagination"""
        query = db.query(User)
        if not include_inactive:
            query = query.filter(User.status == "active")
        return query.offset(skip).limit(limit).all()
    
    def get_by_role(self, db: Session, role: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Get users by role"""
        return db.query(User).filter(User.role == role).offset(skip).limit(limit).all()
    
    def create(self, db: Session, user_in: UserCreate) -> User:
        """Create a new user"""
        db_user = User(
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            name=user_in.name,
            role=user_in.role,
            employee_code=user_in.employee_code,
            manager_id=user_in.manager_id,
            hod_id=user_in.hod_id,
            department=user_in.department
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    def update(self, db: Session, user_id: int, user_in: UserUpdate) -> Optional[User]:
        """Update a user"""
        db_user = self.get(db, user_id)
        if not db_user:
            return None
        
        update_data = user_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    def update_last_login(self, db: Session, user_id: int) -> Optional[User]:
        """Update user's last login timestamp"""
        db_user = self.get(db, user_id)
        if not db_user:
            return None
        
        db_user.last_login = datetime.utcnow()
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    def delete(self, db: Session, user_id: int) -> str | bool:
        """Delete a user. Falls back to archive if referenced by other records."""
        db_user = self.get(db, user_id)
        if not db_user:
            return False

        try:
            db.delete(db_user)
            db.commit()
            return "deleted"
        except IntegrityError as exc:
            db.rollback()
            db_user.status = "inactive"
            if not db_user.email.endswith(".archived"):
                db_user.email = f"{db_user.email}.archived"
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            return "archived"
    
    def authenticate(self, db: Session, email: str, password: str) -> Optional[User]:
        user = self.get_by_email(db, email)

        if not user:
            return None

        password_ok = verify_password(password, user.password_hash)

        if not password_ok:
            return None

        return user



    
    def create_candidate(self, db: Session, user_in) -> User:
        """Create a candidate user (public registration only)"""
        db_user = User(
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            name=user_in.name,
            role="candidate"
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user


crud_user = CRUDUser()
