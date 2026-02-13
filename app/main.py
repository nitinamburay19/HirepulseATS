"""
Main FastAPI application entry point with resume parsing feature
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import auth, admin, recruiter, manager, candidate
from app.core.config import settings
from app.database import engine
from app.database import Base
from app.models.notification import NotificationLog  # noqa: F401
import os
import logging
from fastapi import Request
import time
import re
from app.core.logging import setup_logging
from fastapi.responses import JSONResponse, Response

setup_logging()
logger = logging.getLogger("hirepulse")



# Create database tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Error creating database tables: {e}")

# Create upload directories if they don't exist
os.makedirs("uploads/candidate_documents", exist_ok=True)
os.makedirs("uploads/parsed_resumes", exist_ok=True)
os.makedirs("uploads/temp", exist_ok=True)

# Initialize FastAPI app
app = FastAPI(
    title="HirePulse API",
    description="Backend API for HirePulse Recruitment System with Resume Parsing",
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "HirePulse Support",
        "email": "support@hirepulse.com",
    },
    license_info={
        "name": "Proprietary",
        "url": "https://hirepulse.com/terms",
    }
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.CORS_ALLOW_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)


def _origin_allowed(origin: str | None) -> bool:
    if not origin:
        return False

    normalized_origin = origin.rstrip("/")
    allowed_origins = {value.rstrip("/") for value in settings.cors_origins_list}
    if normalized_origin in allowed_origins:
        return True

    try:
        return re.match(settings.CORS_ALLOW_ORIGIN_REGEX, normalized_origin) is not None
    except re.error:
        return False


@app.middleware("http")
async def ensure_cors_headers(request: Request, call_next):
    origin = request.headers.get("origin")
    is_allowed = _origin_allowed(origin)

    if request.method == "OPTIONS" and is_allowed:
        response = Response(status_code=204)
    else:
        try:
            response = await call_next(request)
        except Exception:
            logger.exception("Unhandled request error")
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"},
            )

    if is_allowed and origin:
        request_headers = request.headers.get("access-control-request-headers", "*")
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS,PATCH"
        response.headers["Access-Control-Allow-Headers"] = request_headers
        response.headers["Access-Control-Expose-Headers"] = "*"

    return response

# Serve static files (uploaded documents)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(recruiter.router, prefix="/api", tags=["Recruiter"])
app.include_router(manager.router, prefix="/api", tags=["Manager"])
app.include_router(candidate.router, prefix="/api", tags=["Candidate"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to HirePulse API",
        "version": "1.1.0",
        "features": [
            "Authentication & Authorization",
            "Admin Dashboard",
            "Recruiter Dashboard", 
            "Manager Dashboard",
            "Candidate Portal",
            "Resume Parsing & Auto-fill",
            "Job Application Tracking",
            "Interview Scheduling",
            "Offer Management"
        ],
        "docs": "/docs",
        "health": "/health",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    from sqlalchemy import text
    from datetime import datetime
    
    try:
        # Database health check
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # System info (psutil is optional)
    cpu_percent = None
    memory_percent = None
    disk_percent = None
    uptime = None
    try:
        import psutil  # type: ignore
        cpu_percent = psutil.cpu_percent()
        memory_percent = psutil.virtual_memory().percent
        disk_percent = psutil.disk_usage('/').percent
        uptime = psutil.boot_time()
    except Exception:
        pass

    system_info = {
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "cpu_percent": cpu_percent,
        "memory_percent": memory_percent,
        "disk_usage": disk_percent,
        "uptime": uptime,
    }
    
    return {
        "status": "healthy",
        "system": system_info,
        "services": {
            "api": "running",
            "database": "running" if db_status == "healthy" else "error",
            "resume_parser": "available"
        }
    }

@app.get("/system/info")
async def system_info():
    """System information endpoint"""
    import platform
    import sys
    
    return {
        "python_version": sys.version,
        "platform": platform.platform(),
        "system": platform.system(),
        "processor": platform.processor(),
        "api_version": "1.1.0",
        "resume_parsing": {
            "supported_formats": ["pdf", "docx", "txt"],
            "features": [
                "Contact extraction",
                "Skill extraction", 
                "Experience calculation",
                "Education parsing",
                "Company detection",
                "Auto-profile update",
                "Job matching"
            ]
        }
    }

@app.post("/utils/resume/test-parse")
async def test_resume_parse(
    file: UploadFile = File(...),
    extract_skills: bool = True,
    extract_experience: bool = True
):
    """
    Test endpoint for resume parsing (for development only)
    """
    # Save uploaded file temporarily
    temp_path = f"uploads/temp/{file.filename}"
    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    try:
        # Parse resume
        from app.services.resume_parser import resume_parser
        result = resume_parser.parse_resume(temp_path)
        
        # Clean up
        os.remove(temp_path)
        
        return {
            "filename": file.filename,
            "file_size": len(content),
            "parse_result": result
        }
        
    except Exception as e:
        # Clean up on error
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing resume: {str(e)}"
        )

@app.get("/utils/generate-test-data")
async def generate_test_data():
    """
    Generate test data for development (admin only)
    """
    # This would require authentication in production
    try:
        from scripts.seed_data import seed_sample_data
        seed_sample_data()
        return {"message": "Test data generated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating test data: {str(e)}"
        )

# Error handlers
@app.exception_handler(404)
async def not_found_exception_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"}
    )

@app.exception_handler(500)
async def internal_exception_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("🚀 Starting HirePulse API Server")
    logger.info(f"🌍 Environment : {'Production' if not settings.DEBUG else 'Development'}")
    logger.info(f"🗄️  Database     : {settings.DATABASE_URL.split('@')[-1]}")
    logger.info("📄 API Docs     : http://127.0.0.1:8000/docs")
    logger.info("=" * 60)

    # Initialize NLP models
    try:
        import spacy
        import nltk

        try:
            spacy.load("en_core_web_sm")
            logger.info("🧠 spaCy model loaded successfully")
        except Exception:
            logger.warning("⚠️  spaCy model not found (resume parsing limited)")

        try:
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('corpora/stopwords')
            logger.info("📚 NLTK data available")
        except LookupError:
            logger.info("⬇️  Downloading NLTK data...")
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            logger.info("✅ NLTK data downloaded")

    except ImportError as e:
        logger.warning(f"⚠️  NLP libraries missing: {e}")
    except Exception as e:
        logger.error(f"❌ NLP initialization failed: {e}")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("Shutting down HirePulse API server...")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        duration = round((time.time() - start_time) * 1000, 2)
        logger.info(
            f"{request.method} {request.url.path} "
            f"→ {response.status_code} ({duration}ms)"
        )
        return response
    except Exception as exc:
        duration = round((time.time() - start_time) * 1000, 2)
        logger.exception(
            f"{request.method} {request.url.path} "
            f"→ 500 ({duration}ms): {exc}"
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )


