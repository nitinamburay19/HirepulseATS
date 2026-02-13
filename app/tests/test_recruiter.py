"""
Recruiter API tests
"""
import pytest
from fastapi import status

def test_get_recruiter_stats(client, recruiter_token):
    """Test getting recruiter dashboard statistics"""
    response = client.get(
        "/api/stats/recruiter-dashboard",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "kpis" in response.json()
    assert "matrixData" in response.json()

def test_get_all_agencies(client, recruiter_token):
    """Test getting all agencies"""
    response = client.get(
        "/api/agencies",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_empanel_new_agency(client, recruiter_token):
    """Test empaneling a new agency"""
    response = client.post(
        "/api/agencies",
        headers={"Authorization": f"Bearer {recruiter_token}"},
        json={
            "agencyName": "Test Agency",
            "hq": "New York",
            "type": "specialized",
            "structure": "domestic",
            "spoc": "John Doe",
            "spocEmail": "john@agency.com",
            "spocPhone": "+1234567890"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["name"] == "Test Agency"

def test_get_all_jobs(client, recruiter_token):
    """Test getting all jobs"""
    response = client.get(
        "/api/jobs",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_create_job_posting(client, recruiter_token):
    """Test creating a job posting"""
    response = client.post(
        "/api/jobs",
        headers={"Authorization": f"Bearer {recruiter_token}"},
        json={
            "title": "Senior Developer",
            "dept": "Engineering",
            "budgetMin": 100000,
            "budgetMax": 150000,
            "description": "Test job description",
            "skillsRequired": ["Python", "FastAPI"]
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["title"] == "Senior Developer"


def test_generate_job_description(client, recruiter_token):
    """Test generating job summary/description content"""
    response = client.post(
        "/api/jobs/generate-description",
        headers={"Authorization": f"Bearer {recruiter_token}"},
        json={"title": "Backend Engineer"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert "summary" in response.json()
    assert "description" in response.json()

def test_get_all_mprs(client, recruiter_token):
    """Test getting all MPRs"""
    response = client.get(
        "/api/mpr",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_update_mpr_status(client, recruiter_token, db):
    """Test updating MPR status"""
    from app.models.mpr import MPR, MPRStatus
    
    # Create a test MPR
    mpr = MPR(
        requisition_code="TEST-MPR-001",
        job_title="Test Job",
        job_description="Test Description",
        department="Engineering",
        hiring_manager_id=1,
        job_type="permanent",
        budget_min=50000,
        budget_max=80000,
        status=MPRStatus.ACTIVE
    )
    db.add(mpr)
    db.commit()
    db.refresh(mpr)
    
    # Update MPR status
    response = client.put(
        f"/api/mpr/{mpr.id}/status",
        headers={"Authorization": f"Bearer {recruiter_token}"},
        json={"status": "FROZEN"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "Updated"

def test_get_all_candidates(client, recruiter_token):
    """Test getting all candidates"""
    response = client.get(
        "/api/candidates",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_ai_candidate_screening(client, recruiter_token, db):
    """Test AI candidate screening"""
    from app.models.candidate import Candidate
    from app.models.user import User, UserRole, UserStatus
    
    # Create a test candidate
    user = User(
        email="screening_test@example.com",
        password_hash="hashed_password",
        name="Screening Test",
        role=UserRole.CANDIDATE,
        status=UserStatus.ACTIVE
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    candidate = Candidate(
        user_id=user.id,
        skills=["Python", "Testing"]
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    
    # Run AI screening
    response = client.post(
        f"/api/candidates/{candidate.id}/screen",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "score" in response.json()
    assert "summary" in response.json()

def test_get_all_interviews(client, recruiter_token):
    """Test getting all interviews"""
    response = client.get(
        "/api/interviews",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_submit_interview_evaluation(client, recruiter_token, db):
    """Test submitting interview evaluation"""
    from app.models.interview import Interview, InterviewRound, InterviewMode, InterviewStatus
    from app.models.candidate import Candidate
    from app.models.user import User, UserRole, UserStatus
    
    # Create test data
    user = User(
        email="interview_test@example.com",
        password_hash="hashed_password",
        name="Interview Test",
        role=UserRole.CANDIDATE,
        status=UserStatus.ACTIVE
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    candidate = Candidate(user_id=user.id)
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    
    interview = Interview(
        candidate_id=candidate.id,
        round=InterviewRound.TECHNICAL_1,
        scheduled_time="2024-01-15T10:00:00Z",
        mode=InterviewMode.VIDEO_CALL,
        status=InterviewStatus.COMPLETED,
        created_by=1
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    
    # Submit evaluation
    response = client.post(
        "/api/interviews/evaluation",
        headers={"Authorization": f"Bearer {recruiter_token}"},
        json={
            "interviewId": interview.id,
            "candidateId": candidate.id,
            "overallRating": 4,
            "outcome": "pass",
            "feedback": "Good performance"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "message" in response.json()
    assert response.json()["message"] == "Success"

def test_get_all_offers(client, recruiter_token):
    """Test getting all offers"""
    response = client.get(
        "/api/offers",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_release_new_offer(client, recruiter_token, db):
    """Test releasing a new offer"""
    from app.models.candidate import Candidate
    from app.models.user import User, UserRole, UserStatus
    from app.models.job import Job, JobStatus
    
    # Create test data
    user = User(
        email="offer_test@example.com",
        password_hash="hashed_password",
        name="Offer Test",
        role=UserRole.CANDIDATE,
        status=UserStatus.ACTIVE
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    candidate = Candidate(user_id=user.id)
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    
    job = Job(
        title="Test Job",
        description="Test Description",
        department="Engineering",
        status=JobStatus.OPEN
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Release offer
    response = client.post(
        "/api/offers",
        headers={"Authorization": f"Bearer {recruiter_token}"},
        json={
            "candidateId": candidate.id,
            "jobId": job.id,
            "ctcFixed": 100000,
            "doj": "2024-02-01T00:00:00Z"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "offerCode" in response.json()
