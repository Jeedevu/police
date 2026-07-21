from sqlalchemy import Column, Integer, String
from app.database.base import Base


class InvestigationOfficer(Base):

    __tablename__ = "investigationofficer"

    officer_id = Column(Integer, primary_key=True)

    name = Column(String(100))

    rank = Column(String(50))

    badge_number = Column(String(50), unique=True)

    police_station = Column(String(100))