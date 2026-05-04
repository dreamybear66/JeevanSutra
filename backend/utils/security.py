"""
Sanjeevani v2 — Security Utilities
PIN hashing, verification, lockout management.
"""

import hashlib
from datetime import datetime, timezone, timedelta
from settings import get_settings


def hash_pin(role: str, identifier: str, pin: str) -> str:
    """Hash a PIN using SHA256 with role:identifier:pin format."""
    raw = f"{role.lower()}:{identifier.lower()}:{pin}"
    return hashlib.sha256(raw.encode()).hexdigest()


def verify_pin(role: str, identifier: str, pin: str, stored_hash: str) -> bool:
    """Verify a PIN against a stored hash."""
    return hash_pin(role, identifier, pin) == stored_hash


def is_locked(locked_until: str | None) -> bool:
    """Check if an account is currently locked."""
    if not locked_until:
        return False
    lock_time = datetime.fromisoformat(locked_until.replace("Z", "+00:00"))
    return datetime.now(timezone.utc) < lock_time


def get_lockout_time() -> str:
    """Get the lockout expiry timestamp."""
    settings = get_settings()
    lock_until = datetime.now(timezone.utc) + timedelta(minutes=settings.pin_lockout_minutes)
    return lock_until.isoformat()
