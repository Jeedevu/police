from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Evidence(Base):

    __tablename__ = "evidence"

    evidence_id = Column(Integer, primary_key=True)

    case_id = Column(
        Integer,
        ForeignKey("casemaster.case_id")
    )

    evidence_type = Column(String(100))

    description = Column(String(500))

    file_url = Column(String(255))

    case = relationship("Case")