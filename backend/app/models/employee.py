from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database.base import Base

class Employee(Base):
    __tablename__ = "employee"

    employee_id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("district.district_id"))
    unit_id = Column(Integer, ForeignKey("unit.unit_id"))
    rank_id = Column(Integer, ForeignKey("rank.rank_id"))
    designation_id = Column(Integer, ForeignKey("designation.designation_id"))
    kgid = Column(String(50), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    employee_dob = Column(Date)
    gender_id = Column(Integer)
    blood_group_id = Column(Integer)
    physically_challenged = Column(Boolean, default=False)
    appointment_date = Column(Date)

    district = relationship("District")
    unit = relationship("Unit")
    rank = relationship("Rank")
    designation = relationship("Designation")
