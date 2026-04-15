from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.scan_history import ScanHistory
from utils.auth_utils import get_current_user
from models.user import User

router = APIRouter(prefix="/api", tags=["History"])


@router.get("/history")
def get_history(
    page:         int     = Query(1,  ge=1),
    per_page:     int     = Query(10, ge=1, le=50),
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user)
):
    total   = db.query(ScanHistory).filter(ScanHistory.user_id == current_user.id).count()
    offset  = (page - 1) * per_page
    records = (
        db.query(ScanHistory)
        .filter(ScanHistory.user_id == current_user.id)
        .order_by(ScanHistory.scanned_at.desc())
        .offset(offset).limit(per_page).all()
    )

    return {
        "total": total,
        "page":  page,
        "pages": (total + per_page - 1) // per_page,
        "items": [r.to_dict() for r in records]
    }


@router.delete("/history/{scan_id}")
def delete_scan(
    scan_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user)
):
    scan = db.query(ScanHistory).filter(
        ScanHistory.id      == scan_id,
        ScanHistory.user_id == current_user.id
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Record not found")

    db.delete(scan)
    db.commit()
    return {"message": "Record deleted"}
