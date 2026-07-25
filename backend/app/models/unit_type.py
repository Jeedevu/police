from sqlalchemy import Column, Integer, String, Boolean
from app.database.base import Base

class UnitType(Base):
    __tablename__ = "unittype"

    unit_type_id = Column(Integer, primary_key=True, index=True)
    unit_type_name = Column(String(100), nullable=False)
    city_dist_state = Column(String(100))
    hierarchy = Column(Integer)
    active = Column(Boolean, default=True)
