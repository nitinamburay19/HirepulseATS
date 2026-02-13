"""
Create/update demo users for all roles so login works out of the box.
Safe to run multiple times.
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole, UserStatus


DEMO_USERS = [
    {
        "email": "admin@hirepulse.com",
        "password": "Admin@123",
        "name": "System Administrator",
        "role": UserRole.ADMIN,
        "department": "Administration",
    },
    {
        "email": "recruiter1@hirepulse.com",
        "password": "Recruiter@123",
        "name": "Sarah Johnson",
        "role": UserRole.RECRUITER,
        "department": "HR",
    },
    {
        "email": "manager1@hirepulse.com",
        "password": "Manager@123",
        "name": "David Wilson",
        "role": UserRole.MANAGER,
        "department": "Engineering",
    },
    {
        "email": "candidate1@example.com",
        "password": "Candidate@123",
        "name": "John Smith",
        "role": UserRole.CANDIDATE,
        "department": None,
    },
]


def upsert_demo_users() -> None:
    db = SessionLocal()
    try:
        for row in DEMO_USERS:
            user = db.query(User).filter(User.email == row["email"]).first()
            if user:
                user.name = row["name"]
                user.role = row["role"]
                user.department = row["department"]
                user.status = UserStatus.ACTIVE
                user.password_hash = get_password_hash(row["password"])
                print(f"Updated user: {row['email']}")
            else:
                user = User(
                    email=row["email"],
                    password_hash=get_password_hash(row["password"]),
                    name=row["name"],
                    role=row["role"],
                    department=row["department"],
                    status=UserStatus.ACTIVE,
                )
                db.add(user)
                print(f"Created user: {row['email']}")

        db.commit()
        print("\nDemo credentials:")
        print("Admin: admin@hirepulse.com / Admin@123")
        print("Recruiter: recruiter1@hirepulse.com / Recruiter@123")
        print("Hiring Manager: manager1@hirepulse.com / Manager@123")
        print("Candidate: candidate1@example.com / Candidate@123")
    except Exception as exc:
        db.rollback()
        print(f"Failed to ensure demo users: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    upsert_demo_users()
