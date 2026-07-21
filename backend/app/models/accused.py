from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Accused(Base):

    __tablename__ = "accused"

    accused_id = Column(Integer, primary_key=True)

    case_id = Column(
        Integer,
        ForeignKey("casemaster.case_id")
    )

    name = Column(String(150))
    gender = Column(String(20))
    age = Column(Integer)
    address = Column(String(300))

    # KSP specific sorting reference (e.g. A1, A2...)
    person_id = Column(String(50), nullable=True)

    case = relationship(
        "Case",
        back_populates="accused"
    )

    person = relationship(
        "PersonIdentity",
        primaryjoin="foreign(Accused.name) == PersonIdentity.full_name",
        uselist=False
    )