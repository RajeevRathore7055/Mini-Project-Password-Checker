from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = 'users'

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100), nullable=False)
    email         = Column(String(150), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role          = Column(Enum('user', 'admin', 'superadmin'), nullable=False, default='user')
    created_at    = Column(DateTime, nullable=False, default=datetime.utcnow)
    is_active     = Column(Boolean, nullable=False, default=True)

    login_logs   = relationship('LoginLog',    back_populates='user', lazy=True)
    scan_history = relationship('ScanHistory', back_populates='user', lazy=True)

    def to_dict(self):
        return {
            'id':         self.id,
            'name':       self.name,
            'email':      self.email,
            'role':       self.role,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'is_active':  self.is_active
        }
