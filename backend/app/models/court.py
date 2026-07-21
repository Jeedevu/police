from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class Court(Base):
    __tablename__ = "court"

    court_id = Column(Integer, primary_key=True, index=True)
    court_name = Column(String(150), nullable=False)
    district_id = Column(Integer, ForeignKey("district.district_id"))
    state_id = Column(Integer, ForeignKey("state.state_id"))
    active = Column(Boolean, default=True)

    district = relationship("District")
    state = relationship("State")
