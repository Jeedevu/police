from sqlalchemy import Column, Integer, String, Date
from app.database.base import Base


class PersonIdentity(Base):
    __tablename__ = "personidentity"

    person_id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(150), nullable=False)
    gender = Column(String(20))
    dob = Column(Date)
    age = Column(Integer)

    mobile = Column(String(20))
    email = Column(String(100))

    aadhaar = Column(String(20))
    pan = Column(String(20))
    passport = Column(String(20))

    address = Column(String(300))

    occupation = Column(String(100))
    education = Column(String(100))

    photo_url = Column(String(255))

    risk_score = Column(Integer, default=0)