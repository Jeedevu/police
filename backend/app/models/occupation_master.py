from sqlalchemy import Column, Integer, String
from app.database.base import Base

class OccupationMaster(Base):
    __tablename__ = "occupationmaster"

    occupation_id = Column(Integer, primary_key=True, index=True)
    occupation_name = Column(String(100), nullable=False)
