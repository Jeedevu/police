"""
Officer authentication, Roles, Permissions, and RBAC models.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Table, Text, func
from sqlalchemy.orm import relationship

from app.database.base import Base


class OfficerRole(str, enum.Enum):
    ADMIN = "Admin"
    DGP = "DGP"
    IGP = "IGP"
    DIG = "DIG"
    SP = "SP"
    DSP = "DSP"
    ACP = "ACP"
    INSPECTOR = "Inspector"
    SI = "Sub Inspector"
    ASI = "ASI"
    HC = "Head Constable"
    CONSTABLE = "Constable"
    GUEST = "Guest"


# Role hierarchy — higher number = more access
ROLE_HIERARCHY: dict[str, int] = {
    "ADMIN": 100,
    "Admin": 100,
    "DGP": 90,
    "ADGP": 80,
    "IGP": 70,
    "DIG": 60,
    "SP": 50,
    "DSP": 45,
    "ACP": 40,
    "Inspector": 35,
    "Sub Inspector": 30,
    "SI": 30,
    "ASI": 25,
    "Head Constable": 20,
    "HC": 20,
    "Constable": 10,
    "Analyst": 15,
    "Guest": 1,
}


# Association table for Many-to-Many relationship between Roles and Permissions
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class Role(Base):
    """Role definition for RBAC."""
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    officers = relationship("Officer", back_populates="role_rel")

    def __repr__(self) -> str:
        return f"<Role {self.name}>"


class Permission(Base):
    """Permission definition for RBAC."""
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

    def __repr__(self) -> str:
        return f"<Permission {self.name}>"


class Officer(Base):
    """
    Platform authentication user / officer record.
    Full schema supporting PostgreSQL + JWT + RBAC.
    """
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    officer_id = Column(String(50), unique=True, nullable=True, index=True)
    username = Column(String(100), unique=True, nullable=True, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=True)

    def __init__(self, **kwargs):
        if "password_hash" in kwargs and "hashed_password" not in kwargs:
            kwargs["hashed_password"] = kwargs["password_hash"]
        elif "hashed_password" in kwargs and "password_hash" not in kwargs:
            kwargs["password_hash"] = kwargs["hashed_password"]
        super().__init__(**kwargs)

    # Personal info
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    full_name = Column(String(200), nullable=False)
    badge_number = Column(String(50), unique=True, nullable=True)
    phone = Column(String(20), nullable=True)
    rank = Column(String(50), nullable=True)
    state = Column(String(100), default="Karnataka", nullable=True)
    avatar_url = Column(String(500), nullable=True)

    # Role & permissions
    role = Column(String(50), nullable=False, default="Constable")
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="SET NULL"), nullable=True)

    # Jurisdiction (for Row-Level Security)
    district_id = Column(Integer, ForeignKey("district.district_id"), nullable=True)
    unit_id = Column(Integer, ForeignKey("unit.unit_id"), nullable=True)   # police station / station_id
    division_id = Column(Integer, nullable=True)
    zone_id = Column(Integer, nullable=True)
    range_id = Column(Integer, nullable=True)

    # Operational employee link
    employee_id = Column(Integer, ForeignKey("employee.employee_id"), nullable=True)

    # Account status & Security
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    account_locked_until = Column(DateTime(timezone=True), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    last_password_change = Column(DateTime(timezone=True), nullable=True)

    # Password reset
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    district = relationship("District", foreign_keys=[district_id])
    unit = relationship("Unit", foreign_keys=[unit_id])
    role_rel = relationship("Role", back_populates="officers")

    @property
    def police_station_id(self) -> Optional[int]:
        return self.unit_id

    @police_station_id.setter
    def police_station_id(self, val: Optional[int]):
        self.unit_id = val

    @property
    def hashed_password(self) -> str:
        """Alias for backward compatibility."""
        return self.password_hash

    @hashed_password.setter
    def hashed_password(self, val: str):
        self.password_hash = val

    @property
    def role_level(self) -> int:
        return ROLE_HIERARCHY.get(self.role, 0)

    @property
    def permissions_list(self) -> list[str]:
        """Return list of permission names associated with this officer's role."""
        if self.role_rel and self.role_rel.permissions:
            return [p.name for p in self.role_rel.permissions]
        return []

    def has_permission_level(self, required_level: int) -> bool:
        return self.role_level >= required_level

    def __repr__(self) -> str:
        return f"<Officer {self.badge_number or self.id} | {self.role}>"
