"""
Sanjeevani v2 — Auth Routes
POST /api/login, /api/rotate-pin, /api/logout
"""

from fastapi import APIRouter, HTTPException
from models.auth_models import LoginRequest, LoginResponse, RotatePinRequest
from db.supabase_client import get_supabase_client
from utils.security import hash_pin, verify_pin, is_locked, get_lockout_time
from settings import get_settings
from datetime import datetime, timezone

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    sb = get_supabase_client()
    settings = get_settings()

    # Lookup user
    result = sb.table("pin_access").select("*").eq(
        "identifier", req.identifier
    ).eq("role", req.role).eq("is_active", True).execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = result.data[0]

    # Check lockout
    if is_locked(user.get("locked_until")):
        raise HTTPException(status_code=423, detail="Account locked. Try again later.")

    # Verify PIN
    if not verify_pin(req.role, req.identifier, req.pin, user["pin_hash"]):
        # Increment failed attempts
        attempts = user["failed_attempts"] + 1
        update = {"failed_attempts": attempts, "updated_at": datetime.now(timezone.utc).isoformat()}

        if attempts >= settings.pin_max_attempts:
            update["locked_until"] = get_lockout_time()

        sb.table("pin_access").update(update).eq("id", user["id"]).execute()

        # Log failed attempt
        sb.table("security_audit_logs").insert({
            "actor_identifier": req.identifier,
            "actor_role": req.role,
            "action": "login",
            "status": "failed",
            "detail": f"Attempt {attempts}/{settings.pin_max_attempts}",
        }).execute()

        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Success — reset failed attempts
    sb.table("pin_access").update({
        "failed_attempts": 0,
        "locked_until": None,
        "last_login_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", user["id"]).execute()

    # Log success
    sb.table("security_audit_logs").insert({
        "actor_identifier": req.identifier,
        "actor_role": req.role,
        "action": "login",
        "status": "success",
    }).execute()

    return LoginResponse(
        success=True,
        display_name=user.get("display_name"),
        must_rotate=user.get("must_rotate", False),
        message="Login successful",
    )


@router.post("/rotate-pin")
async def rotate_pin(req: RotatePinRequest):
    sb = get_supabase_client()

    # Verify old PIN first
    result = sb.table("pin_access").select("*").eq(
        "identifier", req.identifier
    ).eq("role", req.role).eq("is_active", True).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = result.data[0]
    if not verify_pin(req.role, req.identifier, req.old_pin, user["pin_hash"]):
        raise HTTPException(status_code=401, detail="Old PIN incorrect")

    # Update PIN
    new_hash = hash_pin(req.role, req.identifier, req.new_pin)
    sb.table("pin_access").update({
        "pin_hash": new_hash,
        "must_rotate": False,
        "pin_changed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", user["id"]).execute()

    sb.table("security_audit_logs").insert({
        "actor_identifier": req.identifier,
        "actor_role": req.role,
        "action": "rotate_pin",
        "status": "success",
    }).execute()

    return {"success": True, "message": "PIN rotated successfully"}
