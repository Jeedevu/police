"""
AuditLog model for recording system security and user activity events.
"""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.database.base import Base


class AuditLog(Base):
    """
    Stores audit log events for login, logout, failed login attempts,
    password changes, evidence upload/delete, case updates, user management, etc.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("officers.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    resource = Column(String(150), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("Officer", foreign_keys=[user_id])

    def __repr__(self) -> str:
        return f"<AuditLog {self.action} by User {self.user_id} at {self.created_at}>"
