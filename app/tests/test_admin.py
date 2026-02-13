"""
Admin API tests
"""
import pytest
from fastapi import status

def test_get_admin_stats(client, admin_token):
    """Test getting admin dashboard statistics"""
    response = client.get(
        "/api/stats/admin-dashboard",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "kpis" in response.json()
    assert "velocityData" in response.json()
    assert isinstance(response.json()["kpis"], list)

def test_get_admin_stats_unauthorized(client):
    """Test getting admin stats without authorization"""
    response = client.get("/api/stats/admin-dashboard")
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_all_users(client, admin_token):
    """Test getting all users"""
    response = client.get(
        "/api/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_create_user(client, admin_token):
    """Test creating a new user"""
    response = client.post(
        "/api/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "email": "new_admin_user@hirepulse.com",
            "password": "Password@123",
            "name": "New Admin User",
            "role": "admin"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["email"] == "new_admin_user@hirepulse.com"
    assert response.json()["role"] == "admin"

def test_update_user(client, admin_token, db):
    """Test updating a user"""
    from app.models.user import User, UserRole, UserStatus
    from app.core.security import get_password_hash
    
    # Create a test user
    test_user = User(
        email="update_test@hirepulse.com",
        password_hash=get_password_hash("Password@123"),
        name="Update Test",
        role=UserRole.RECRUITER,
        status=UserStatus.ACTIVE
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    # Update the user
    response = client.put(
        f"/api/users/{test_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "Updated Name",
            "status": "inactive"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["name"] == "Updated Name"
    assert response.json()["status"] == "inactive"

def test_delete_user(client, admin_token, db):
    """Test deleting a user"""
    from app.models.user import User, UserRole, UserStatus
    from app.core.security import get_password_hash
    
    # Create a test user
    test_user = User(
        email="delete_test@hirepulse.com",
        password_hash=get_password_hash("Password@123"),
        name="Delete Test",
        role=UserRole.RECRUITER,
        status=UserStatus.ACTIVE
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    # Delete the user
    response = client.delete(
        f"/api/users/{test_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    
    # Verify user is deleted
    deleted_user = db.query(User).filter(User.id == test_user.id).first()
    assert deleted_user is None

def test_delete_user_with_references_archives_user(client, admin_token, db):
    """Test deleting referenced user falls back to archive (inactive) instead of failing."""
    from app.models.user import User, UserRole, UserStatus
    from app.models.candidate import Candidate
    from app.core.security import get_password_hash

    referenced_user = User(
        email="candidate_delete_test@hirepulse.com",
        password_hash=get_password_hash("Password@123"),
        name="Referenced Candidate",
        role=UserRole.CANDIDATE,
        status=UserStatus.ACTIVE
    )
    db.add(referenced_user)
    db.commit()
    db.refresh(referenced_user)

    candidate_profile = Candidate(
        user_id=referenced_user.id,
        phone="+911234567890",
        skills=["Python"]
    )
    db.add(candidate_profile)
    db.commit()

    response = client.delete(
        f"/api/users/{referenced_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "archived"

    archived_user = db.query(User).filter(User.id == referenced_user.id).first()
    assert archived_user is not None
    status_value = archived_user.status.value if hasattr(archived_user.status, "value") else archived_user.status
    assert status_value == UserStatus.INACTIVE.value

def test_get_mpr_config(client, admin_token):
    """Test getting MPR configuration"""
    response = client.get(
        "/api/config/mpr",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "freeze" in response.json()
    assert "aiScore" in response.json()

def test_update_mpr_config(client, admin_token):
    """Test updating MPR configuration"""
    response = client.put(
        "/api/config/mpr",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "freeze": True,
            "strictVetting": False,
            "aiScore": 80,
            "budgetTolerance": 15
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "Updated"

def test_get_blacklist(client, admin_token):
    """Test getting blacklist"""
    response = client.get(
        "/api/blacklist",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_add_to_blacklist(client, admin_token):
    """Test adding to blacklist"""
    response = client.post(
        "/api/blacklist",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "Test Blacklist",
            "reason": "Testing",
            "risk": "medium",
            "notes": "Test entry"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["name"] == "Test Blacklist"
    assert response.json()["reason"] == "Testing"

def test_remove_from_blacklist(client, admin_token, db):
    """Test removing from blacklist"""
    from app.models.blacklist import Blacklist, RiskLevel
    
    # Create a blacklist entry
    blacklist_entry = Blacklist(
        name="Remove Test",
        reason="Testing removal",
        risk_level=RiskLevel.MEDIUM,
        blacklisted_by=1,
        is_active=True
    )
    db.add(blacklist_entry)
    db.commit()
    db.refresh(blacklist_entry)
    
    # Remove from blacklist
    response = client.delete(
        f"/api/blacklist/{blacklist_entry.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK

def test_get_offer_audit_queue(client, admin_token):
    """Test getting offer audit queue"""
    response = client.get(
        "/api/admin/offers/audit-queue",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_get_offers_analytics(client, admin_token):
    """Test getting offers analytics payload"""
    response = client.get(
        "/api/admin/offers/analytics",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert "queue" in payload
    assert "budget" in payload
    assert "velocity" in payload
    assert isinstance(payload["queue"], list)
    assert isinstance(payload["budget"], list)
    assert isinstance(payload["velocity"], dict)

def test_admin_role_required(client, candidate_token):
    """Test that admin endpoints require admin role"""
    response = client.get(
        "/api/stats/admin-dashboard",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN
