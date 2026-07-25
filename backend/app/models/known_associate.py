from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class KnownAssociate(Base):

    __tablename__ = "knownassociate"

    associate_id = Column(Integer, primary_key=True)

    person_id = Column(
        Integer,
        ForeignKey("personidentity.person_id")
    )

    associate_person_id = Column(
        Integer,
        ForeignKey("personidentity.person_id")
    )

    relationship_type = Column(String(100))

    confidence = Column(Integer)

    person = relationship(
        "PersonIdentity",
        foreign_keys=[person_id]
    )

    associate = relationship(
        "PersonIdentity",
        foreign_keys=[associate_person_id]
    )