"""
Application configuration settings
"""
from pydantic_settings import BaseSettings
from typing import Optional, List
import os


def _normalize_database_url(raw_url: str) -> str:
    """
    Normalize database URL for SQLAlchemy.

    Railway often provides postgres://... while SQLAlchemy expects
    postgresql+psycopg2://... for psycopg2.
    """
    url = (raw_url or "").strip()
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def _database_url_from_env() -> str:
    direct = (
        os.getenv("DATABASE_URL")
        or os.getenv("DATABASE_PRIVATE_URL")
        or os.getenv("POSTGRES_URL")
    )
    if direct:
        return _normalize_database_url(direct)

    # Fallback for environments that expose PG* vars.
    host = os.getenv("PGHOST")
    port = os.getenv("PGPORT", "5432")
    user = os.getenv("PGUSER")
    password = os.getenv("PGPASSWORD")
    dbname = os.getenv("PGDATABASE")
    if host and user and password and dbname:
        return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{dbname}"

    if os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_PROJECT_ID"):
        raise RuntimeError(
            "Database URL is not configured. Set DATABASE_URL (or DATABASE_PRIVATE_URL) in Railway."
        )

    return "postgresql+psycopg2://user:password@localhost:5432/hirepulse"

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str = _database_url_from_env()
    
    # JWT
    SECRET_KEY: str = "change-me-in-production"
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
