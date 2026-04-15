import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY    = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret')
ALGORITHM     = "HS256"
ACCESS_EXPIRE = 24 * 60  # 24 hours in minutes

bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash password using bcrypt directly."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain.encode('utf-8'),
            hashed.encode('utf-8')
        )
    except Exception:
        return False


def create_token(user_id: int, name: str, role: str) -> str:
    """Create JWT access token."""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_EXPIRE)
    data   = {
        "sub":  str(user_id),
        "name": name,
        "role": role,
        "exp":  expire
    }
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and verify JWT token."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get currently logged in user from JWT token."""
    payload = decode_token(credentials.credentials)
    user    = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: Session = Depends(get_db)
):
    """Get user if token provided, else return None (for guest access)."""
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        return db.query(User).filter(
            User.id == int(payload["sub"])
        ).first()
    except Exception:
        return None


def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Require admin or superadmin role."""
    if current_user.role not in ['admin', 'superadmin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
