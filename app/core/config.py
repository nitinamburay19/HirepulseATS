"""
Application configuration settings
"""
from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str = "postgresql+psycopg2://hirepulse_user:Admin%%40123@localhost:5432/hirepulse"
    
    # JWT
    SECRET_KEY: str = "your-super-secret-jwt-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Application
    APP_NAME: str = "HirePulse"
    DEBUG: bool = False
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    CORS_ALLOW_ORIGIN_REGEX: str = r"https?://(localhost|127\.0\.0\.1)(:\d+)?$"

    # Email notifications
    EMAIL_ENABLED: bool = True
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 25
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_TLS: bool = False
    EMAIL_FROM: str = "no-reply@hirepulse.com"

    @property
    def cors_origins_list(self) -> List[str]:
        origins: List[str] = []
        for raw_origin in self.CORS_ORIGINS.split(","):
            origin = raw_origin.strip().rstrip("/")
            if origin:
                origins.append(origin)
        return origins
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
