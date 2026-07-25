from sqlalchemy import Column, Integer, String, Boolean
from app.database.base import Base

class CrimeHead(Base):
    __tablename__ = "crimehead"

    crime_head_id = Column(Integer, primary_key=True, index=True)
    crime_group_name = Column(String(100), nullable=False)
    active = Column(Boolean, default=True)
