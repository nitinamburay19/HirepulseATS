"""
Initialize database with default data
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base
from app.core.security import get_password_hash

def init_db() -> None:
    """Initialize database with tables and default data"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create default admin user if not exists
        from app.models.user import User, UserRole, UserStatus
        
        admin_user = db.query(User).filter(User.email == "admin@hirepulse.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@hirepulse.com",
                password_hash=get_password_hash("Admin@123"),
                name="System Administrator",
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE
            )
            db.add(admin_user)
            print("Created admin user: admin@hirepulse.com / Admin@123")
        
        # Create default MPR config if not exists
        from app.models.mpr import MPRConfig
        mpr_config = db.query(MPRConfig).first()
        if not mpr_config:
            mpr_config = MPRConfig(
                freeze=False,
                strict_vetting=True,
                ai_score_threshold=70,
                budget_tolerance_percent=10,
                updated_by=1  # Assuming admin user ID is 1
            )
            db.add(mpr_config)
            print("Created default MPR configuration")
        
        db.commit()
        print("Database initialized successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()