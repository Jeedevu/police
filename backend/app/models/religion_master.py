from sqlalchemy import Column, Integer, String
from app.database.base import Base

class ReligionMaster(Base):
    __tablename__ = "religionmaster"

    religion_id = Column(Integer, primary_key=True, index=True)
    religion_name = Column(String(100), nullable=False)
