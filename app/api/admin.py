"""
Admin dashboard API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.utils.dependencies import get_current_user, require_role
from app.schemas.user import UserResponse, UserCreate, UserUpdate
from app.schemas.mpr import MPRConfigUpdate, MPRConfigResponse
from app.schemas.blacklist import BlacklistCreate, BlacklistResponse, BlacklistUpdate
from app.crud.user import crud_user
from app.crud.mpr import crud_mpr
from app.crud.blacklist import crud_blacklist
from app.crud.offer import crud_offer
from app.services.admin import admin_service
from pydantic import ValidationError

router = APIRouter()


def _enum_value(value):
    return value.value if hasattr(value, "value") else value

@router.get("/stats/admin-dashboard", response_model=Dict[str, Any])
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("admin"))
):
    """
    Get admin dashboard statistics
    
    Fetch all KPI data for the main admin dashboard
    """
    service = admin_service(db)
    return service.get_admin_stats()

@router.get("/users", response_model=List[Dict[str, Any]])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("admin"))
):
    """
    Get all users
    
    Retrieve a list of all users in the system
    """
    users = crud_user.get_all(db, skip=skip, limit=limit, include_inactive=include_inactive)
    return [
        {
            "id": user.id,
            "name": user.name,
            "role": _enum_value(user.role),
            "status": _enum_value(user.status),
            "lastLogin": user.last_login.isoformat() if user.last_login else None,
            "email": user.email,
            "department": user.department
        }
        for user in users
    ]

@router.post("/users", response_model=Dict[str, Any])
async def create_user(
    user_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("admin"))
):
    """
    Create a new user
    
    Add a new user to the system
    """
    role_value = str(user_data.get("role", "candidate")).strip().lower()
    role_aliases = {
        "administrator": "admin",
        "admin": "admin",
        "recruiter": "recruiter",
        "hiring_manager": "manager",
        "manager": "manager",
        "candidate": "candidate",
    }
    normalized_role = role_aliases.get(role_value, role_value)

    create_payload = {
        "email": user_data.get("email"),
        "password": user_data.get("password"),
        "name": user_data.get("name"),
        "role": normalized_role,
        "department": user_data.get("department"),
        "employee_code": user_data.get("employee_code") or user_data.get("employeeCode"),
        "manager_id": user_data.get("manager_id") or user_data.get("managerId"),
        "hod_id": user_data.get("hod_id") or user_data.get("hodId"),
    }

    try:
        validated_user = UserCreate(**create_payload)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(),
        )

    user = crud_user.create(db, validated_user)
    return {
        "id": user.id,
        "name": user.name,
        "role": _enum_value(user.role),
        "email": user.email,
        "status": _enum_value(user.status)
    }

@router.put("/users/{user_id}", response_model=Dict[str, Any])
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("admin"))
):
    """
    Update user
    
    Update details for a specific user
    """
    user = crud_user.update(db, user_id, user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": user.id,
        "name": user.name,
        "role": _enum_value(user.role),
        "email": user.email,
        "status": _enum_value(user.status)
    }

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("admin"))
):
    """
    Delete user
    
    Permanently remove a user from the system
    """
    if current_user.get("id") == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own admin account"
        )

    success = crud_user.delete(db, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {"status": success}

@router.get("/config/mpr", response_model=Dict[str, Any])
async def get_mpr_config(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("admin"))
):
    """
    Get MPR configuration
    
    Get current MPR configuration settings
    """
    config = crud_mpr.get_config(db)
    if not config:
        # Return defaults
        return {
            "freeze": False,
            "strictVetting": True,
            "aiScore": 70,
            "budgetTolerance": 10
        }
    
    return {
        "freeze": config.freeze,
        "strictVetting": config.strict_vetting,
        "aiScore": config.ai_score_threshold,
        "budgetTolerance": config.budget_tolerance_percent
    }

@router.put("/config/mpr", response_model=Dict[str, Any])
async def update_mpr_config(
    config_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("admin"))
):
    """
    Update MPR configuration
    
    Update MPR configuration settings
    """
    # Convert to schema
    update_data = MPRConfigUpdate(
        freeze=config_data.get("freeze", False),
        strict_vetting=config_data.get("strictVetting", True),
        ai_score_threshold=config_data.get("aiScore", 70),
        budget_tolerance_percent=config_data.get("budgetTolerance", 10)
    )
    
    config = crud_mpr.update_config(db, update_data, current_user["id"])
    return {"message": "Updated"}

@router.get("/blacklist", response_model=List[Dict[str, Any]])
async def get_blacklist(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("admin"))
):
    """
    Get blacklist
    
    Retrieve all blacklisted identities
    """
    entries = crud_blacklist.get_all_blacklist(db)
    return [
        {
            "id": entry.id,
            "name": entry.name,
            "reason": entry.reason,
            "date": entry.blacklisted_at.isoformat(),
            "risk": _enum_value(entry.risk_level),
            "notes": entry.notes,
            "email": entry.email,
            "isActive": entry.is_active
        }
        for entry in entries
    ]

@router.post("/blacklist", response_model=Dict[str, Any])
async def add_to_blacklist(
    blacklist_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("admin"))
):
    """
    Add to blacklist
    
    Add a new identity to the blacklist
    """
    # Convert to schema
    create_data = BlacklistCreate(
        name=blacklist_data["name"],
        email=blacklist_data.get("email"),
        phone=blacklist_data.get("phone"),
        reason=blacklist_data["reason"],
        risk_level=str(blacklist_data.get("risk", "medium")).lower(),
        notes=blacklist_data.get("notes"),
        blacklisted_by=current_user["id"]
    )
    
    entry = crud_blacklist.create_blacklist_entry(db, create_data)
    return {
        "id": entry.id,
        "name": entry.name,
        "reason": entry.reason,
        "risk": _enum_value(entry.risk_level)
    }

@router.delete("/blacklist/{entry_id}")
async def remove_from_blacklist(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("admin"))
):
    """
    Remove from blacklist
    
    Whitelist an identity (remove from blacklist)
    """
    entry = crud_blacklist.remove_from_blacklist(db, entry_id, current_user["id"])
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blacklist entry not found"
        )
    
    return {}  # 204 No Content

@router.get("/admin/offers/audit-queue", response_model=List[Dict[str, Any]])
async def get_offer_audit_queue(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("admin"))
):
    """
    Get offer audit queue
    
    Fetch high-value/variance offers needing approval
    """
    service = admin_service(db)
    return service.get_offer_audit_queue()


@router.get("/admin/offers/analytics", response_model=Dict[str, Any])
async def get_offers_analytics(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("admin"))
):
    """
    Get full offers analytics

    Returns offer queue, budget consumption, and offer velocity for admin view.
    """
    service = admin_service(db)
    return service.get_offers_analytics()


@router.post("/admin/offers/{offer_id}/approve", response_model=Dict[str, Any])
async def approve_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(require_role("admin"))
):
    """
    Approve offer as admin reviewer
    """
    offer = crud_offer.approve_offer(db, offer_id, current_user["id"])
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )

    return {
        "id": offer.id,
        "status": _enum_value(offer.status),
        "requiresApproval": offer.requires_approval,
        "approvedBy": offer.approved_by,
    }
