from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, CHAR
from sqlalchemy.orm import relationship
from app.database.base import Base

class ChargesheetDetails(Base):
    __tablename__ = "chargesheetdetails"

    cs_id = Column(Integer, primary_key=True, index=True)
    case_master_id = Column(Integer, ForeignKey("casemaster.case_id"), nullable=False)
    cs_date = Column(DateTime)
    cs_type = Column(CHAR(1))  # A->Chargesheet, B->False Case, C->Undetected
    police_person_id = Column(Integer, ForeignKey("employee.employee_id"))

    case = relationship("Case")
    police_person = relationship("Employee")
