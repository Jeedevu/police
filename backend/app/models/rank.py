from sqlalchemy import Column, Integer, String, Boolean
from app.database.base import Base

class Rank(Base):
    __tablename__ = "rank"

    rank_id = Column(Integer, primary_key=True, index=True)
    rank_name = Column(String(100), nullable=False)
    hierarchy = Column(Integer)
    active = Column(Boolean, default=True)
