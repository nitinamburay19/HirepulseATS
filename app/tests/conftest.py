"""
Pytest configuration and fixtures
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.core.security import get_password_hash

# Test database
# Use in-memory SQLite with StaticPool so tests avoid filesystem/OneDrive lock issues.
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    """Create test client with override dependency"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_token(client, db):
    """Get admin auth token"""
    from app.models.user import User, UserRole, UserStatus
    
    # Create admin user if not exists
    admin = db.query(User).filter(User.email == "test_admin@hirepulse.com").first()
    if not admin:
        admin = User(
            email="test_admin@hirepulse.com",
            password_hash=get_password_hash("Admin@123"),
            name="Test Admin",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    
    # Login
    response = client.post("/auth/login", json={
        "email": "test_admin@hirepulse.com",
        "password": "Admin@123",
        "role": "admin"
    })
    
    return response.json()["access_token"]

@pytest.fixture
def recruiter_token(client, db):
    """Get recruiter auth token"""
    from app.models.user import User, UserRole, UserStatus
    
    # Create recruiter user
    recruiter = User(
        email="test_recruiter@hirepulse.com",
        password_hash=get_password_hash("Recruiter@123"),
        name="Test Recruiter",
        role=UserRole.RECRUITER,
        status=UserStatus.ACTIVE
    )
    db.add(recruiter)
    db.commit()
    db.refresh(recruiter)
    
    # Login
    response = client.post("/auth/login", json={
        "email": "test_recruiter@hirepulse.com",
        "password": "Recruiter@123",
        "role": "recruiter"
    })
    
    return response.json()["access_token"]

@pytest.fixture
def candidate_token(client, db):
    """Get candidate auth token"""
    from app.models.user import User, UserRole, UserStatus
    
    # Create candidate user
    candidate = User(
        email="test_candidate@example.com",
        password_hash=get_password_hash("Candidate@123"),
        name="Test Candidate",
        role=UserRole.CANDIDATE,
        status=UserStatus.ACTIVE
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    
    # Create candidate profile
    from app.models.candidate import Candidate
    candidate_profile = Candidate(
        user_id=candidate.id,
        phone="+1234567890",
        skills=["Python", "FastAPI", "Testing"],
        experience_years=3
    )
    db.add(candidate_profile)
    db.commit()
    
    # Login
    response = client.post("/auth/login", json={
        "email": "test_candidate@example.com",
        "password": "Candidate@123",
        "role": "candidate"
    })
    
    return response.json()["access_token"]
