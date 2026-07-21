from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Phone(Base):

    __tablename__ = "phone"

    phone_id = Column(Integer, primary_key=True)

    person_id = Column(
        Integer,
        ForeignKey("personidentity.person_id")
    )

    mobile = Column(String(20))

    imei = Column(String(50))

    sim_number = Column(String(50))

    provider = Column(String(50))

    person = relationship("PersonIdentity")