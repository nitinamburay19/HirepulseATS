"""
Candidate API tests with resume parsing
"""
import pytest
from fastapi import status
import os
import io

def test_get_public_job_board(client):
    """Test getting public job board"""
    response = client.get("/api/jobs/public")
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_apply_for_job(client, candidate_token, db):
    """Test applying for a job"""
    from app.models.job import Job, JobStatus
    
    # Create a test job
    job = Job(
        title="Test Public Job",
        description="Public job for testing",
        department="Engineering",
        status=JobStatus.OPEN,
        visibility="public"
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Apply for the job
    response = client.post(
        f"/api/jobs/{job.id}/apply",
        headers={"Authorization": f"Bearer {candidate_token}"},
        json={
            "personalInfo": {
                "name": "Test Candidate",
                "email": "test_candidate@example.com"
            },
            "professional": {
                "skills": ["Python", "Testing"],
                "experience_years": 3
            }
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "applicationId" in response.json()
    assert "status" in response.json()

def test_get_my_profile(client, candidate_token):
    """Test getting candidate profile"""
    response = client.get(
        "/api/candidate/profile",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "name" in response.json()
    assert "skills" in response.json()
    assert "documents" in response.json()

def test_update_my_profile(client, candidate_token):
    """Test updating candidate profile"""
    response = client.put(
        "/api/candidate/profile",
        headers={"Authorization": f"Bearer {candidate_token}"},
        json={
            "name": "Updated Name",
            "skills": ["Python", "FastAPI", "PostgreSQL", "Testing"],
            "phone": "+9876543210",
            "experienceYears": 5
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["name"] == "Updated Name"
    assert "Python" in response.json()["skills"]

def test_upload_document(client, candidate_token):
    """Test uploading a document"""
    # Create a simple text file
    file_content = b"This is a test resume content"
    files = {
        "file": ("test_resume.txt", file_content, "text/plain")
    }
    
    response = client.post(
        "/api/candidate/documents/upload",
        headers={"Authorization": f"Bearer {candidate_token}"},
        files=files,
        data={"document_type": "resume", "parse_resume": "false"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "documentUrl" in response.json()
    assert response.json()["type"] == "resume"

def test_delete_document(client, candidate_token):
    """Test deleting an uploaded candidate document"""
    file_content = b"Document to delete"
    files = {
        "file": ("delete_me.txt", file_content, "text/plain")
    }

    upload_response = client.post(
        "/api/candidate/documents/upload",
        headers={"Authorization": f"Bearer {candidate_token}"},
        files=files,
        data={"document_type": "resume", "parse_resume": "false"}
    )
    assert upload_response.status_code == status.HTTP_200_OK
    document_id = upload_response.json()["id"]

    delete_response = client.delete(
        f"/api/candidate/documents/{document_id}",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    assert delete_response.status_code == status.HTTP_200_OK
    assert delete_response.json()["id"] == document_id

def test_upload_and_parse_resume(client, candidate_token):
    """Test uploading and parsing a resume"""
    # Create a simple resume text file
    resume_content = b"""John Doe
Senior Software Developer
Email: john.doe@example.com
Phone: +1234567890

SKILLS
Python, FastAPI, PostgreSQL, Docker, AWS

EXPERIENCE
5 years of software development experience

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2018"""
    
    files = {
        "file": ("john_resume.txt", resume_content, "text/plain")
    }
    
    response = client.post(
        "/api/candidate/documents/upload",
        headers={"Authorization": f"Bearer {candidate_token}"},
        files=files,
        data={"document_type": "resume", "parse_resume": "true"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["parsed"] == True
    assert "parse_result" in response.json()

def test_get_application_status(client, candidate_token):
    """Test getting application status"""
    response = client.get(
        "/api/candidate/application-status",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    
    assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
    if response.status_code == 200:
        assert "pipelineSteps" in response.json()
        assert "currentStatus" in response.json()

def test_parse_resume_endpoint(client, candidate_token, db):
    """Test manual resume parsing endpoint"""
    from app.models.candidate import CandidateDocument
    
    # First upload a document
    file_content = b"""Test Resume
Skills: Python, FastAPI
Experience: 3 years"""
    
    files = {
        "file": ("parse_test.txt", file_content, "text/plain")
    }
    
    upload_response = client.post(
        "/api/candidate/documents/upload",
        headers={"Authorization": f"Bearer {candidate_token}"},
        files=files,
        data={"document_type": "resume", "parse_resume": "false"}
    )
    
    document_id = upload_response.json()["id"]
    
    # Now parse it
    response = client.post(
        f"/api/candidate/resume/parse/{document_id}",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["success"] == True
    assert "updates_applied" in response.json()

def test_get_resume_suggestions(client, candidate_token, db):
    """Test getting resume suggestions for a job"""
    from app.models.job import Job, JobStatus
    
    # Create a test job
    job = Job(
        title="Python Developer",
        description="Looking for Python developer with FastAPI experience",
        department="Engineering",
        status=JobStatus.OPEN,
        visibility="public",
        skills_required=["Python", "FastAPI", "Docker", "AWS"]
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    response = client.get(
        f"/api/candidate/resume/suggestions/{job.id}",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "match_score" in response.json()
    assert "suggestions" in response.json()
    assert "missing_keywords" in response.json()

def test_auto_fill_application(client, candidate_token, db):
    """Test auto-filling job application"""
    from app.models.job import Job, JobStatus
    
    # Create a test job
    job = Job(
        title="Auto-fill Test Job",
        description="Test job for auto-fill",
        department="Engineering",
        status=JobStatus.OPEN,
        visibility="public"
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    response = client.get(
        f"/api/jobs/{job.id}/auto-fill",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "success" in response.json()
    if response.json()["success"]:
        assert "application_data" in response.json()
        assert "match_score" in response.json()

def test_get_parsed_resume_data(client, candidate_token):
    """Test getting parsed resume data"""
    response = client.get(
        "/api/candidate/resume/parsed-data",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    
    # Can be 404 if no resume parsed yet
    assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

def test_apply_with_auto_fill(client, candidate_token, db):
    """Test applying for job with auto-fill"""
    from app.models.job import Job, JobStatus
    
    # Create a test job
    job = Job(
        title="Auto-apply Test Job",
        description="Test job for auto-apply",
        department="Engineering",
        status=JobStatus.OPEN,
        visibility="public"
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    response = client.post(
        f"/api/jobs/{job.id}/apply",
        headers={"Authorization": f"Bearer {candidate_token}"},
        params={"auto_fill": True}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "autoFilled" in response.json()
    assert response.json()["autoFilled"] == True
    assert "matchScore" in response.json()

def test_upload_invalid_file_type(client, candidate_token):
    """Test uploading invalid file type"""
    file_content = b"Invalid file"
    files = {
        "file": ("test.exe", file_content, "application/octet-stream")
    }
    
    response = client.post(
        "/api/candidate/documents/upload",
        headers={"Authorization": f"Bearer {candidate_token}"},
        files=files,
        data={"document_type": "resume"}
    )
    
    # Should either accept or reject with appropriate status
    assert response.status_code in [200, 400, 415]

def test_candidate_role_required(client, admin_token):
    """Test that candidate endpoints require candidate role"""
    response = client.get(
        "/api/candidate/profile",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_candidate_can_accept_offer(client, candidate_token, db):
    """Test candidate accepts own offer"""
    from app.models.user import User, UserRole, UserStatus
    from app.models.candidate import Candidate
    from app.models.job import Job, JobStatus
    from app.models.offer import Offer, OfferStatus
    from datetime import datetime, timedelta

    recruiter = User(
        email="offer_recruiter@hirepulse.com",
        password_hash="hashed_password",
        name="Offer Recruiter",
        role=UserRole.RECRUITER,
        status=UserStatus.ACTIVE
    )
    db.add(recruiter)
    db.commit()
    db.refresh(recruiter)

    candidate_user = db.query(User).filter(User.email == "test_candidate@example.com").first()
    candidate_profile = db.query(Candidate).filter(Candidate.user_id == candidate_user.id).first()

    job = Job(
        title="Offer Candidate Job",
        description="Offer test role",
        department="Engineering",
        status=JobStatus.OPEN,
        visibility="public"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    offer = Offer(
        candidate_id=candidate_profile.id,
        job_id=job.id,
        offer_code="TEST-OFFER-001",
        ctc_fixed=100000,
        ctc_variable=10000,
        ctc_total=110000,
        date_of_joining=datetime.utcnow() + timedelta(days=30),
        offer_validity_days=15,
        status=OfferStatus.OFFERED,
        offered_by=recruiter.id,
        offered_at=datetime.utcnow(),
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)

    response = client.put(
        f"/api/candidate/offers/{offer.id}/decision",
        headers={"Authorization": f"Bearer {candidate_token}"},
        json={"decision": "accepted"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "accepted"


def test_candidate_can_request_joining_after_acceptance(client, candidate_token, db):
    """Test candidate can raise joining confirmation request after accepting offer"""
    from app.models.user import User, UserRole, UserStatus
    from app.models.candidate import Candidate
    from app.models.job import Job, JobStatus
    from app.models.offer import Offer, OfferStatus
    from datetime import datetime, timedelta

    recruiter = User(
        email="offer_recruiter_join@hirepulse.com",
        password_hash="hashed_password",
        name="Offer Recruiter Join",
        role=UserRole.RECRUITER,
        status=UserStatus.ACTIVE
    )
    db.add(recruiter)
    db.commit()
    db.refresh(recruiter)

    candidate_user = db.query(User).filter(User.email == "test_candidate@example.com").first()
    candidate_profile = db.query(Candidate).filter(Candidate.user_id == candidate_user.id).first()

    job = Job(
        title="Offer Join Request Job",
        description="Offer join request role",
        department="Engineering",
        status=JobStatus.OPEN,
        visibility="public"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    offer = Offer(
        candidate_id=candidate_profile.id,
        job_id=job.id,
        offer_code="TEST-OFFER-002",
        ctc_fixed=120000,
        ctc_variable=10000,
        ctc_total=130000,
        date_of_joining=datetime.utcnow() + timedelta(days=30),
        offer_validity_days=15,
        status=OfferStatus.ACCEPTED,
        offered_by=recruiter.id,
        offered_at=datetime.utcnow(),
        accepted_at=datetime.utcnow(),
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)

    response = client.post(
        f"/api/candidate/offers/{offer.id}/join-request",
        headers={"Authorization": f"Bearer {candidate_token}"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["joinRequest"]["status"] == "pending"
