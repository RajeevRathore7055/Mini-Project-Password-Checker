from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models.scan_history import ScanHistory
from models.breach_alert import BreachAlert
from schemas.analyze_schema import BreachRequest
from services.breach_service import check_hibp
from utils.auth_utils import get_optional_user
import socket


def get_local_ip() -> str:
    """Get actual local machine IP (192.168.x.x)."""
    try:
        # Connect to a remote address to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"


def get_client_ip(request: Request) -> str:
    """
    Get best available IP:
    1. X-Forwarded-For header (production proxy)
    2. X-Real-IP header
    3. Actual local machine IP (development)
    """
    # Check proxy headers first (for production)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
        if ip and ip != "127.0.0.1":
            return ip

    real_ip = request.headers.get("X-Real-IP")
    if real_ip and real_ip != "127.0.0.1":
        return real_ip

    # Get request IP
    client_ip = request.client.host if request.client else "127.0.0.1"

    # If localhost — return actual machine IP
    if client_ip in ("127.0.0.1", "::1", "localhost"):
        return get_local_ip()

    return client_ip


router = APIRouter(prefix="/api", tags=["Breach Check"])


@router.post("/breach/check")
def breach_check(
    data:         BreachRequest,
    request:      Request,
    db:           Session = Depends(get_db),
    current_user          = Depends(get_optional_user)
):
    # Run HIBP check
    result = check_hibp(data.password)

    if "error" in result:
        raise HTTPException(status_code=502, detail=result["error"])

    # If password IS breached — save IP alert
    if result["is_breached"] and current_user:
        ip = get_client_ip(request)

        # Password hint — sirf pehle 2 chars + ***
        hint = data.password[:2] + "***" if len(data.password) >= 2 else "***"

        # Save to breach_alerts table
        alert = BreachAlert(
            user_id       = current_user.id,
            user_name     = current_user.name,
            ip_address    = ip,
            breach_count  = result["breach_count"],
            password_hint = hint
        )
        db.add(alert)
        db.commit()

    # Update scan_history record if scan_id provided
    if current_user and data.scan_id:
        scan = db.query(ScanHistory).filter(
            ScanHistory.id      == data.scan_id,
            ScanHistory.user_id == current_user.id
        ).first()
        if scan:
            scan.is_breached  = result["is_breached"]
            scan.breach_count = result["breach_count"]
            db.commit()

    return result
