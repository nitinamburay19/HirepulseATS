"""
Authentication service
"""
from datetime import timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.crud.user import crud_user
from app.crud.candidate import crud_candidate
from app.core.security import create_access_token
from app.core.config import settings
from app.schemas.user import UserLogin, UserRegister, UserCreate
from app.schemas.candidate import CandidateProfileCreate


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _normalize_role(role_value) -> str:
        if role_value is None:
            return ""
        if hasattr(role_value, "value"):
            role_value = role_value.value
        return str(role_value).strip().lower()

    @classmethod
    def _roles_match(cls, requested_role, user_role) -> bool:
        requested = cls._normalize_role(requested_role)
        actual = cls._normalize_role(user_role)
        if not requested:
            return True
        if requested == actual:
            return True
        equivalent = {
            "manager": {"manager", "hod"},
            "hod": {"manager", "hod"},
        }
        return actual in equivalent.get(requested, {requested})

    def authenticate_user(self, login_data: UserLogin) -> dict:
        # 🔑 Authenticate user
        user = crud_user.authenticate(
            self.db,
            login_data.email,
            login_data.password
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Check role if specified
        if not self._roles_match(login_data.role, user.role):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid role for user"
            )

        # Update last login
        crud_user.update_last_login(self.db, user.id)

        # Create access token
        access_token_expires = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

        access_token = create_access_token(
            data={
                "sub": user.email,
                "user_id": user.id,
                "role": user.role,
            },
            expires_delta=access_token_expires,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": self._normalize_role(user.role),
                
            },
        }

    def register_user(self, register_data: UserRegister) -> dict:
        # Check if user already exists
        existing_user = crud_user.get_by_email(
            self.db,
            register_data.email
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        create_data = UserCreate(
            email=register_data.email,
            password=register_data.password,
            name=register_data.name,
            role=register_data.role,
        )
        user = crud_user.create(self.db, create_data)

        if self._normalize_role(user.role) == "candidate":
            existing_profile = crud_candidate.get_profile_by_user_id(self.db, user.id)
            if not existing_profile:
                profile_data = CandidateProfileCreate(user_id=user.id)
                crud_candidate.create_profile(self.db, profile_data)

        return {
            "message": "User registered successfully",
            "user_id": user.id,
            "role": user.role,
        }

    def get_current_user(self, token: str) -> dict:
        from app.core.security import decode_token

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

        user = crud_user.get_by_email(self.db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": self._normalize_role(user.role),
            
        }


auth_service = AuthService
