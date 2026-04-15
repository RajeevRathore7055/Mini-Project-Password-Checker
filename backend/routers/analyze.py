from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.scan_history import ScanHistory
from schemas.analyze_schema import AnalyzeRequest
from services.password_service import rule_based_score
from ml.strength_model import predict_strength
from utils.auth_utils import get_optional_user

router = APIRouter(prefix="/api", tags=["Password Analysis"])


@router.post("/analyze")
def analyze(
    data:         AnalyzeRequest,
    db:           Session = Depends(get_db),
    current_user          = Depends(get_optional_user)
):
    if not data.password:
        raise HTTPException(status_code=400, detail="Password cannot be empty")

    if len(data.password) > 128:
        raise HTTPException(status_code=400, detail="Password too long (max 128 characters)")

    rule_result = rule_based_score(data.password)
    ml_result   = predict_strength(data.password)

    scan_id = None
    if current_user:
        scan = ScanHistory(
            user_id       = current_user.id,
            rule_score    = rule_result['score'],
            rule_label    = rule_result['label'],
            ml_label      = ml_result['label'],
            ml_confidence = ml_result['confidence'],
            entropy       = rule_result['entropy']
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)
        scan_id = scan.id

    return {
        "scan_id":    scan_id,
        "rule_based": rule_result,
        "ml":         ml_result
    }
