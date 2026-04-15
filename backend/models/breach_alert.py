from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class BreachAlert(Base):
    __tablename__ = 'breach_alerts'

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey('users.id'), nullable=True)
    user_name     = Column(String(100), nullable=False)
    ip_address    = Column(String(45),  nullable=False)
    breach_count  = Column(Integer,     nullable=False, default=0)
    password_hint = Column(String(10),  nullable=False)
    detected_at   = Column(DateTime,    nullable=False, default=datetime.utcnow)

    user = relationship('User', backref='breach_alerts')

    def to_dict(self):
        return {
            'id':            self.id,
            'user_id':       self.user_id,
            'user_name':     self.user_name,
            'ip_address':    self.ip_address,
            'breach_count':  self.breach_count,
            'password_hint': self.password_hint,
            'detected_at':   self.detected_at.strftime('%Y-%m-%d %H:%M:%S')
        }
