from sqlalchemy import Column, Integer, String
from app.database.base import Base

class GravityOffence(Base):
    __tablename__ = "gravityoffence"

    gravity_offence_id = Column(Integer, primary_key=True, index=True)
    lookup_value = Column(String(50), nullable=False)
