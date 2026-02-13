"""
Manager API tests
"""
import pytest
from fastapi import status

def test_get_manager_stats(client, admin_token):  # Using admin as manager for test
    """Test getting manager dashboard statistics"""
    response = client.get(
        "/api/stats/manager-dashboard",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "headcount" in response.json()
    assert "openReq" in response.json()

def test_get_manager_pipeline(client, admin_token):
    """Test getting manager pipeline"""
    response = client.get(
        "/api/manager/pipeline",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)


def test_get_manager_pipeline_candidates(client, admin_token):
    """Test manager pipeline candidate drill-down endpoint"""
    response = client.get(
        "/api/manager/pipeline-candidates",
        headers={"Authorization": f"Bearer {admin_token}"},
        params={"job_title": "Any Role", "stage": "Profiles Received"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_get_my_mprs(client, admin_token, db):
    """Test getting manager's MPRs"""
    from app.models.mpr import MPR, MPRStatus
    
    # Create a test MPR for the manager
    mpr = MPR(
        requisition_code="MANAGER-MPR-001",
        job_title="Manager Test Job",
        job_description="Test Description",
        department="Engineering",
        hiring_manager_id=1,  # Assuming admin has id 1
        job_type="permanent",
        budget_min=50000,
        budget_max=80000,
        status=MPRStatus.ACTIVE
    )
    db.add(mpr)
    db.commit()
    
    response = client.get(
        "/api/mpr/my-requests",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0

def test_create_mpr(client, admin_token):
    """Test creating an MPR"""
    response = client.post(
        "/api/mpr",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "jobTitle": "New Manager Position",
            "jobDescription": "New role for team expansion",
            "department": "Engineering",
            "jobType": "permanent",
            "budgetMin": 80000,
            "budgetMax": 120000,
            "experienceRequired": 5,
            "skillsRequired": ["Python", "Leadership"]
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "requisitionCode" in response.json()
    assert response.json()["jobTitle"] == "New Manager Position"

def test_get_my_interviews(client, admin_token, db):
    """Test getting manager's interviews"""
    from app.models.interview import Interview, InterviewRound, InterviewMode, InterviewStatus
    from app.models.candidate import Candidate
    from app.models.user import User, UserRole, UserStatus
    
    # Create test interview with manager on panel
    user = User(
        email="manager_interview@example.com",
        password_hash="hashed_password",
        name="Manager Interview",
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
        round=InterviewRound.MANAGERIAL,
        scheduled_time="2024-01-20T14:00:00Z",
        mode=InterviewMode.VIDEO_CALL,
        status=InterviewStatus.SCHEDULED,
        panel_members=[1],  # Manager with id 1
        created_by=1
    )
    db.add(interview)
    db.commit()
    
    response = client.get(
        "/api/manager/interviews",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_submit_interview_feedback(client, admin_token):
    """Test submitting interview feedback"""
    response = client.post(
        "/api/manager/interviews/feedback",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "interviewId": 1,
            "rating": 4,
            "outcome": "pass",
            "remarks": "Good candidate"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "message" in response.json()
    assert response.json()["message"] == "Success"
