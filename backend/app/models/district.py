from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class District(Base):
    __tablename__ = "district"

    district_id = Column(Integer, primary_key=True, index=True)
    district_name = Column(String(100), nullable=False)
    state_id = Column(Integer, ForeignKey("state.state_id"), nullable=False)
    active = Column(Boolean, default=True)

    state = relationship("State")
