from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Complainant(Base):

    __tablename__ = "complainantdetails"

    complainant_id = Column(Integer, primary_key=True)

    case_id = Column(
        Integer,
        ForeignKey("casemaster.case_id")
    )

    name = Column(String(150))
    gender = Column(String(20))
    age = Column(Integer)
    mobile = Column(String(20))
    address = Column(String(300))

    # KSP Lookup fields
    occupation_id = Column(Integer, ForeignKey("occupationmaster.occupation_id"), nullable=True)
    religion_id = Column(Integer, ForeignKey("religionmaster.religion_id"), nullable=True)
    caste_id = Column(Integer, ForeignKey("castemaster.caste_master_id"), nullable=True)

    occupation = relationship("OccupationMaster")
    religion = relationship("ReligionMaster")
    caste = relationship("CasteMaster")

    person = relationship(
        "PersonIdentity",
        primaryjoin="foreign(Complainant.name) == PersonIdentity.full_name",
        uselist=False
    )

    case = relationship(
        "Case",
        back_populates="complainants"
    )