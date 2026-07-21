from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class CrimeSubHead(Base):
    __tablename__ = "crimesubhead"

    crime_sub_head_id = Column(Integer, primary_key=True, index=True)
    crime_head_id = Column(Integer, ForeignKey("crimehead.crime_head_id"), nullable=False)
    crime_head_name = Column(String(100), nullable=False)
    seq_id = Column(Integer)

    crime_head = relationship("CrimeHead")
