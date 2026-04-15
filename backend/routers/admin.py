from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.user import User
from models.scan_history import ScanHistory
from models.login_log import LoginLog
from models.breach_alert import BreachAlert
from schemas.admin_schema import AddUserRequest, ChangeRoleRequest
from utils.auth_utils import require_admin, get_current_user, hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def is_superadmin(user: User) -> bool:
    return user.role == 'superadmin'


# ── STATS ─────────────────────────────────────────────────────────────────────
@router.get("/stats")
def get_stats(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin)
):
    dist = db.query(
        ScanHistory.rule_label,
        func.count(ScanHistory.id)
    ).group_by(ScanHistory.rule_label).all()

    logs = (
        db.query(LoginLog)
        .order_by(LoginLog.attempt_at.desc())
        .limit(50).all()
    )

    return {
        "total_users":    db.query(User).count(),
        "total_scans":    db.query(ScanHistory).count(),
        "total_breached": db.query(ScanHistory).filter_by(is_breached=True).count(),
        "total_banned":   db.query(User).filter_by(is_active=False).count(),
        "distribution":   {label: count for label, count in dist},
        "login_logs":     [l.to_dict() for l in logs]
    }


# ── GET ALL USERS ─────────────────────────────────────────────────────────────
@router.get("/users")
def get_users(
    search:       str     = Query(""),
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin)
):
    query = db.query(User)
    if search:
        query = query.filter(
            User.name.ilike(f"%{search}%") |
            User.email.ilike(f"%{search}%")
        )
    users = query.order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        scan_count = db.query(ScanHistory).filter_by(user_id=u.id).count()
        result.append({**u.to_dict(), "scan_count": scan_count})
    return {"users": result, "total": len(result)}


# ── ADD USER ──────────────────────────────────────────────────────────────────
@router.post("/users/add")
def add_user(
    data:         AddUserRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin)
):
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if db.query(User).filter(User.email == data.email.lower()).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if db.query(User).filter(User.name.ilike(data.name)).first():
        raise HTTPException(status_code=409, detail="Name already taken")

    role = data.role if data.role in ['user', 'admin', 'superadmin'] else 'user'
    user = User(
        name          = data.name.strip(),
        email         = data.email.lower(),
        password_hash = hash_password(data.password),
        role          = role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": f"User {user.name} created!", "user": user.to_dict()}


# ── DELETE USER ───────────────────────────────────────────────────────────────
@router.delete("/users/{user_id}")
def delete_user(
    user_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.query(ScanHistory).filter_by(user_id=user_id).delete()
    db.query(LoginLog).filter_by(user_id=user_id).delete()
    db.query(BreachAlert).filter_by(user_id=user_id).delete()
    db.delete(user)
    db.commit()
    return {"message": f"User {user.name} deleted"}


# ── BAN / UNBAN ───────────────────────────────────────────────────────────────
@router.put("/users/{user_id}/ban")
def ban_user(
    user_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot ban your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    db.commit()
    status = "unbanned" if user.is_active else "banned"
    return {"message": f"User {user.name} {status}", "is_active": user.is_active}


# ── CHANGE ROLE ───────────────────────────────────────────────────────────────
@router.put("/users/{user_id}/role")
def change_role(
    user_id:      int,
    data:         ChangeRoleRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    if data.role not in ['user', 'admin', 'superadmin']:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role  = user.role
    user.role = data.role
    db.commit()
    return {"message": f"{user.name}: {old_role} → {data.role}", "user": user.to_dict()}


# ── USER SCANS ────────────────────────────────────────────────────────────────
@router.get("/users/{user_id}/scans")
def get_user_scans(
    user_id:      int,
    page:         int     = Query(1, ge=1),
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    total   = db.query(ScanHistory).filter_by(user_id=user_id).count()
    records = (
        db.query(ScanHistory)
        .filter_by(user_id=user_id)
        .order_by(ScanHistory.scanned_at.desc())
        .offset((page - 1) * 10).limit(10).all()
    )
    return {
        "user":  user.to_dict(),
        "total": total,
        "pages": (total + 9) // 10,
        "page":  page,
        "items": [r.to_dict() for r in records]
    }


# ── SECURITY LOGS ─────────────────────────────────────────────────────────────
@router.get("/security")
def get_security(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin)
):
    flagged = db.query(LoginLog).filter_by(is_flagged=True).order_by(LoginLog.attempt_at.desc()).limit(100).all()
    failed  = db.query(LoginLog).filter_by(status='failed').order_by(LoginLog.attempt_at.desc()).limit(50).all()

    return {
        "flagged_count": len(flagged),
        "flagged_logs":  [l.to_dict() for l in flagged],
        "failed_logs":   [l.to_dict() for l in failed]
    }


# ── BREACH ALERTS — SUPER ADMIN ONLY ─────────────────────────────────────────
@router.get("/breach-alerts")
def get_breach_alerts(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin)
):
    if not is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Super Admin access only")

    alerts = (
        db.query(BreachAlert)
        .order_by(BreachAlert.detected_at.desc())
        .all()
    )
    return {
        "total":  len(alerts),
        "alerts": [a.to_dict() for a in alerts]
    }


# ── DELETE SINGLE BREACH ALERT — SUPER ADMIN ONLY ────────────────────────────
@router.delete("/breach-alerts/{alert_id}")
def delete_breach_alert(
    alert_id:     int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin)
):
    if not is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Super Admin access only")

    alert = db.query(BreachAlert).filter(BreachAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return {"message": f"Breach alert for {alert.user_name} deleted"}


# ── DELETE ALL BREACH ALERTS — SUPER ADMIN ONLY ──────────────────────────────
@router.delete("/breach-alerts")
def delete_all_breach_alerts(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin)
):
    if not is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Super Admin access only")

    count = db.query(BreachAlert).count()
    db.query(BreachAlert).delete()
    db.commit()
    return {"message": f"All {count} breach alerts deleted successfully"}

@router.delete("/api/admin/security/{id}")
def delete_log(id: int, db: Session = Depends(get_db)):
    log = db.query(LoginLog).filter(LoginLog.id == id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    db.delete(log)
    db.commit()
    return {"message": "Log deleted"}