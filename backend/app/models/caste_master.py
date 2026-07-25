from sqlalchemy import Column, Integer, String
from app.database.base import Base

class CasteMaster(Base):
    __tablename__ = "castemaster"

    caste_master_id = Column(Integer, primary_key=True, index=True)
    caste_master_name = Column(String(100), nullable=False)
