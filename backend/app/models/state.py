from sqlalchemy import Column, Integer, String, Boolean
from app.database.base import Base

class State(Base):
    __tablename__ = "state"

    state_id = Column(Integer, primary_key=True, index=True)
    state_name = Column(String(100), nullable=False)
    nationality_id = Column(Integer)
    active = Column(Boolean, default=True)
