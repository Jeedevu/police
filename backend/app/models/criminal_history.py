from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class CriminalHistory(Base):

    __tablename__ = "criminalhistory"

    history_id = Column(Integer, primary_key=True)

    person_id = Column(
        Integer,
        ForeignKey("personidentity.person_id")
    )

    case_id = Column(
        Integer,
        ForeignKey("casemaster.case_id")
    )

    crime_type = Column(String(100))
    arrest_date = Column(Date)
    conviction = Column(String(100))
    sentence = Column(String(200))
    status = Column(String(50))

    person = relationship("PersonIdentity")
    case = relationship("Case")