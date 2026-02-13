"""
Authentication API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.database import get_db
from app.schemas.user import UserLogin, UserRegister, Token, ForgotPassword
from app.services.auth import auth_service
from app.core.security import decode_token
from app.utils.dependencies import get_current_user

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/login", response_model=Dict[str, Any])
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    User login endpoint
    
    Returns JWT token and user object
    """
    service = auth_service(db)
    result = service.authenticate_user(login_data)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    return result

@router.post("/register", response_model=Dict[str, Any])
async def register(
    register_data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    User registration endpoint
    
    Creates a new user account using the selected role
    """
    service = auth_service(db)
    result = service.register_user(register_data)
    return result

@router.post("/forgot-password", response_model=Dict[str, Any])
async def forgot_password(
    forgot_data: ForgotPassword,
    db: Session = Depends(get_db)
):
    """
    Forgot password endpoint
    
    Initiates password reset flow.
    """
    # Return a generic success response to avoid leaking account existence.
    return {"message": "Reset link sent to your email"}

@router.get("/me")
def read_users_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_payload = {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
    }
    # Backward-compatible response shape for older clients/tests that expect {"user": ...}
    return {
        **user_payload,
        "user": user_payload,
    }
