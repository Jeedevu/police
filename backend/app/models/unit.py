from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class Unit(Base):
    __tablename__ = "unit"

    unit_id = Column(Integer, primary_key=True, index=True)
    unit_name = Column(String(100), nullable=False)
    type_id = Column(Integer, ForeignKey("unittype.unit_type_id"))
    parent_unit = Column(Integer, ForeignKey("unit.unit_id"), nullable=True)
    nationality_id = Column(Integer)
    state_id = Column(Integer, ForeignKey("state.state_id"))
    district_id = Column(Integer, ForeignKey("district.district_id"))
    active = Column(Boolean, default=True)

    unit_type = relationship("UnitType")
    state = relationship("State")
    district = relationship("District")
