"""
Dependency injection functions
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.core.security import decode_token
from app.crud.user import crud_user

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def _normalize_value(value) -> str:
    if hasattr(value, "value"):
        value = value.value
    return str(value).strip().lower()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> dict:
    """
    Get current user from JWT token
    """
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = crud_user.get_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return {
        "id": user.id,
        "email": user.email,
        "role": _normalize_value(user.role),
        "name": user.name,
        "status": _normalize_value(user.status),
    }

def require_role(required_role: str):
    """
    Dependency to require specific user role
    """
    def role_dependency(
        current_user: dict = Depends(get_current_user)
    ) -> dict:
        if _normalize_value(current_user["role"]) != _normalize_value(required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {required_role} role"
            )
        return current_user
    return role_dependency

def require_any_role(required_roles: list):
    """
    Dependency to require any of the specified roles
    """
    def role_dependency(
        current_user: dict = Depends(get_current_user)
    ) -> dict:
        normalized_current_role = _normalize_value(current_user["role"])
        normalized_required_roles = {_normalize_value(role) for role in required_roles}
        if normalized_current_role not in normalized_required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(required_roles)}"
            )
        return current_user
    return role_dependency
