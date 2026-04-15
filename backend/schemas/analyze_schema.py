from pydantic import BaseModel
from typing import Optional, Dict, Any


class AnalyzeRequest(BaseModel):
    password: str


class BreachRequest(BaseModel):
    password: str
    scan_id:  Optional[int] = None


class AnalyzeResponse(BaseModel):
    scan_id:    Optional[int]
    rule_based: Dict[str, Any]
    ml:         Dict[str, Any]


class BreachResponse(BaseModel):
    is_breached:  bool
    breach_count: int
    message:      str
