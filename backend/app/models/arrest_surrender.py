from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database.base import Base

class ArrestSurrender(Base):
    __tablename__ = "arrestsurrender"

    arrest_surrender_id = Column(Integer, primary_key=True, index=True)
    case_master_id = Column(Integer, ForeignKey("casemaster.case_id"), nullable=False)
    arrest_surrender_type_id = Column(Integer)  # Lookup value
    arrest_surrender_date = Column(Date)
    arrest_surrender_state_id = Column(Integer, ForeignKey("state.state_id"))
    arrest_surrender_district_id = Column(Integer, ForeignKey("district.district_id"))
    police_station_id = Column(Integer, ForeignKey("unit.unit_id"))
    io_id = Column(Integer, ForeignKey("employee.employee_id"))
    court_id = Column(Integer, ForeignKey("court.court_id"))
    accused_master_id = Column(Integer, ForeignKey("accused.accused_id"))
    is_accused = Column(Boolean, default=True)
    is_complainant_accused = Column(Boolean, default=False)

    case = relationship("Case")
    state = relationship("State")
    district = relationship("District")
    police_station = relationship("Unit")
    io = relationship("Employee")
    court = relationship("Court")
    accused = relationship("Accused")
