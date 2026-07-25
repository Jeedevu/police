from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class Section(Base):
    __tablename__ = "section"

    act_code = Column(String(50), ForeignKey("act.act_code"), primary_key=True)
    section_code = Column(String(50), primary_key=True)
    section_description = Column(String(500))
    active = Column(Boolean, default=True)

    act = relationship("Act")
