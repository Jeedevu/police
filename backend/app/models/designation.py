from sqlalchemy import Column, Integer, String, Boolean
from app.database.base import Base

class Designation(Base):
    __tablename__ = "designation"

    designation_id = Column(Integer, primary_key=True, index=True)
    designation_name = Column(String(100), nullable=False)
    active = Column(Boolean, default=True)
    sort_order = Column(Integer)
