"""
Authentication API tests
"""
import pytest
from fastapi import status

def test_register_user(client):
    """Test user registration"""
    response = client.post("/auth/register", json={
        "email": "new_user@example.com",
        "password": "Password@123",
        "name": "New User"
    })
    
    assert response.status_code == status.HTTP_200_OK
    assert "message" in response.json()
    assert response.json()["message"] == "User registered successfully"

def test_register_duplicate_email(client):
    """Test registering with duplicate email"""
    # First registration
    client.post("/auth/register", json={
        "email": "duplicate@example.com",
        "password": "Password@123",
        "name": "First User"
    })
    
    # Second registration with same email
    response = client.post("/auth/register", json={
        "email": "duplicate@example.com",
        "password": "Password@123",
        "name": "Second User"
    })
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already registered" in response.json()["detail"]

def test_login_success(client):
    """Test successful login"""
    # First register
    client.post("/auth/register", json={
        "email": "login_test@example.com",
        "password": "Password@123",
        "name": "Login Test"
    })
    
    # Then login
    response = client.post("/auth/login", json={
        "email": "login_test@example.com",
        "password": "Password@123"
    })
    
    assert response.status_code == status.HTTP_200_OK
    assert "access_token" in response.json()
    assert "user" in response.json()
    assert response.json()["user"]["email"] == "login_test@example.com"

def test_login_wrong_password(client):
    """Test login with wrong password"""
    # Register user
    client.post("/auth/register", json={
        "email": "wrong_pass@example.com",
        "password": "Password@123",
        "name": "Wrong Pass"
    })
    
    # Login with wrong password
    response = client.post("/auth/login", json={
        "email": "wrong_pass@example.com",
        "password": "WrongPassword"
    })
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_login_nonexistent_user(client):
    """Test login with non-existent user"""
    response = client.post("/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "Password@123"
    })
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_current_user(client, candidate_token):
    """Test getting current user with valid token"""
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "user" in response.json()
    assert response.json()["user"]["email"] == "test_candidate@example.com"

def test_get_current_user_no_token(client):
    """Test getting current user without token"""
    response = client.get("/auth/me")
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_current_user_invalid_token(client):
    """Test getting current user with invalid token"""
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_forgot_password(client):
    """Test forgot password endpoint"""
    response = client.post("/auth/forgot-password", json={
        "email": "test@example.com"
    })
    
    assert response.status_code == status.HTTP_200_OK
    assert "message" in response.json()
    assert "sent" in response.json()["message"].lower()

def test_login_with_role_check(client):
    """Test login with specific role check"""
    # Register as candidate (default)
    client.post("/auth/register", json={
        "email": "role_test@example.com",
        "password": "Password@123",
        "name": "Role Test"
    })
    
    # Login with admin role (should fail)
    response = client.post("/auth/login", json={
        "email": "role_test@example.com",
        "password": "Password@123",
        "role": "admin"
    })
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    # Login without role (should succeed)
    response = client.post("/auth/login", json={
        "email": "role_test@example.com",
        "password": "Password@123"
    })
    
    assert response.status_code == status.HTTP_200_OK

def test_weak_password(client):
    """Test registration with weak password"""
    response = client.post("/auth/register", json={
        "email": "weak@example.com",
        "password": "123",  # Too short
        "name": "Weak Password"
    })
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_invalid_email(client):
    """Test registration with invalid email"""
    response = client.post("/auth/register", json={
        "email": "invalid-email",
        "password": "Password@123",
        "name": "Invalid Email"
    })
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY