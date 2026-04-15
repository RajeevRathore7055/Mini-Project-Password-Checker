from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class LoginLog(Base):
    __tablename__ = 'login_logs'

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey('users.id'), nullable=True)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(Text, nullable=True)
    status     = Column(Enum('success', 'failed'), nullable=False)
    attempt_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    is_flagged = Column(Boolean, nullable=False, default=False)

    user = relationship('User', back_populates='login_logs')

    def to_dict(self):
        return {
            'id':         self.id,
            'user_id':    self.user_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'status':     self.status,
            'attempt_at': self.attempt_at.strftime('%Y-%m-%d %H:%M:%S'),
            'is_flagged': self.is_flagged
        }
