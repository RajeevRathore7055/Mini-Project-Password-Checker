from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# used for changing the time history in super admin section 
class ScanHistory(Base):
    __tablename__ = 'scan_history'

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey('users.id'), nullable=True)
    rule_score    = Column(Integer, nullable=False)
    rule_label    = Column(String(10), nullable=False)
    ml_label      = Column(String(10), nullable=False)
    ml_confidence = Column(Float, nullable=False)
    entropy       = Column(Float, nullable=False)
    is_breached   = Column(Boolean, nullable=True, default=None)
    breach_count  = Column(Integer, nullable=True, default=None)
    scanned_at    = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship('User', back_populates='scan_history')

    def to_dict(self):
        return {
            'id':            self.id,
            'rule_score':    self.rule_score,
            'rule_label':    self.rule_label,
            'ml_label':      self.ml_label,
            'ml_confidence': round(self.ml_confidence * 100, 1),
            'entropy':       round(self.entropy, 2),
            'is_breached':   self.is_breached,
            'breach_count':  self.breach_count,
            'scanned_at':    self.scanned_at.strftime('%Y-%m-%d')
        }
