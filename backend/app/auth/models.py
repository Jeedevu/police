"""
Officer authentication model.
Separate from the existing `employee` table (which holds operational police data).
This table handles login credentials, roles, and jurisdiction assignment.
"""
import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database.base import Base


class OfficerRole(str, enum.Enum):
    ADMIN = "ADMIN"
    DGP = "DGP"
    ADGP = "ADGP"
    IGP = "IGP"
    DIG = "DIG"
    SP = "SP"
    DSP = "DSP"
    ACP = "ACP"
    INSPECTOR = "Inspector"
    SI = "Sub Inspector"
    HC = "Head Constable"
    CONSTABLE = "Constable"
    ANALYST = "Analyst"
    GUEST = "Guest"


# Role hierarchy — higher number = more access
ROLE_HIERARCHY: dict[str, int] = {
    "ADMIN": 100,
    "DGP": 90,
    "ADGP": 80,
    "IGP": 70,
    "DIG": 60,
    "SP": 50,
    "DSP": 45,
    "ACP": 40,
    "Inspector": 35,
    "Sub Inspector": 30,
    "Head Constable": 20,
    "Constable": 10,
    "Analyst": 15,
    "Guest": 1,
}


class Officer(Base):
    """
    Platform authentication user.
    Links to existing `employee` table via employee_id (optional).
    """
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)

    # Personal info
    full_name = Column(String(200), nullable=False)
    badge_number = Column(String(50), unique=True, nullable=True)
    phone = Column(String(20), nullable=True)
    avatar_url = Column(String(500), nullable=True)

    # Role & permissions
    role = Column(String(50), nullable=False, default="Guest")

    # Jurisdiction (for Row-Level Security)
    district_id = Column(Integer, ForeignKey("district.district_id"), nullable=True)
    unit_id = Column(Integer, ForeignKey("unit.unit_id"), nullable=True)   # police station
    division_id = Column(Integer, nullable=True)  # sub-division (future FK)
    zone_id = Column(Integer, nullable=True)
    range_id = Column(Integer, nullable=True)

    # Link to operational employee record
    employee_id = Column(Integer, ForeignKey("employee.employee_id"), nullable=True)

    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Password reset
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    district = relationship("District", foreign_keys=[district_id])
    unit = relationship("Unit", foreign_keys=[unit_id])

    @property
    def role_level(self) -> int:
        return ROLE_HIERARCHY.get(self.role, 0)

    def has_permission_level(self, required_level: int) -> bool:
        return self.role_level >= required_level

    def __repr__(self) -> str:
        return f"<Officer {self.badge_number} | {self.role}>"
