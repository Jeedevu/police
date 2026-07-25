from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Vehicle(Base):

    __tablename__ = "vehicle"

    vehicle_id = Column(Integer, primary_key=True)

    person_id = Column(
        Integer,
        ForeignKey("personidentity.person_id")
    )

    registration_number = Column(String(20), unique=True)

    vehicle_type = Column(String(50))

    model = Column(String(100))

    color = Column(String(50))

    manufacturer = Column(String(100))

    person = relationship("PersonIdentity")