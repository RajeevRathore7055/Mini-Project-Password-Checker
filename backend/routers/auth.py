from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.login_log import LoginLog
from schemas.auth_schema import RegisterRequest, LoginRequest, TokenResponse
from utils.auth_utils import hash_password, verify_password, create_token, get_current_user
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def get_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    return forwarded.split(",")[0].strip() if forwarded else request.client.host


def log_attempt(db, user_id, status, request):
    log = LoginLog(
        user_id    = user_id,
        ip_address = get_ip(request),
        user_agent = request.headers.get("User-Agent", "")[:500],
        status     = status
    )
    db.add(log)
    db.commit()
    if user_id:
        check_suspicious(db, user_id)


def check_suspicious(db, user_id):
    now         = datetime.utcnow()
    ten_min_ago = now - timedelta(minutes=10)
    day_ago     = now - timedelta(hours=24)

    failed = db.query(LoginLog).filter(
        LoginLog.user_id   == user_id,
        LoginLog.status    == 'failed',
        LoginLog.attempt_at >= ten_min_ago
    ).count()

    if failed >= 5:
        db.query(LoginLog).filter(
            LoginLog.user_id    == user_id,
            LoginLog.attempt_at >= ten_min_ago
        ).update({"is_flagged": True})
        db.commit()
        return

    ips = db.query(LoginLog.ip_address).filter(
        LoginLog.user_id    == user_id,
        LoginLog.attempt_at >= day_ago
    ).distinct().count()

    if ips >= 3:
        db.query(LoginLog).filter(
            LoginLog.user_id    == user_id,
            LoginLog.attempt_at >= day_ago
        ).update({"is_flagged": True})
        db.commit()


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    if db.query(User).filter(User.email == data.email.lower()).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    if db.query(User).filter(User.name.ilike(data.name)).first():
        raise HTTPException(status_code=409, detail="This name is already taken")

    user = User(
        name          = data.name.strip(),
        email         = data.email.lower(),
        password_hash = hash_password(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "Registration successful! Please login.", "user": user.to_dict()}


@router.post("/login")
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.name.ilike(data.name.strip())).first()

    if not user or not verify_password(data.password, user.password_hash):
        log_attempt(db, user.id if user else None, "failed", request)
        raise HTTPException(status_code=401, detail="Invalid name or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact admin.")

    token = create_token(user.id, user.name, user.role)
    log_attempt(db, user.id, "success", request)

    return {"message": "Login successful", "token": token, "user": user.to_dict()}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"user": current_user.to_dict()}
