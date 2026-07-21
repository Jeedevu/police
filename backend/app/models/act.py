from sqlalchemy import Column, Integer, String, Boolean
from app.database.base import Base

class Act(Base):
    __tablename__ = "act"

    act_code = Column(String(50), primary_key=True)
    act_description = Column(String(200), nullable=False)
    short_name = Column(String(50))
    active = Column(Boolean, default=True)
