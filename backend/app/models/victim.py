from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Victim(Base):

    __tablename__ = "victim"

    victim_id = Column(Integer, primary_key=True)

    case_id = Column(
        Integer,
        ForeignKey("casemaster.case_id")
    )

    name = Column(String(150))
    gender = Column(String(20))
    age = Column(Integer)
    address = Column(String(300))

    # KSP specific fields
    victim_police = Column(String(10), nullable=True)  # "1" if police employee, "0" otherwise

    person = relationship(
        "PersonIdentity",
        primaryjoin="foreign(Victim.name) == PersonIdentity.full_name",
        uselist=False
    )

    case = relationship(
        "Case",
        back_populates="victims"
    )