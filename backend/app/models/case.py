from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, Numeric, Text
from sqlalchemy.orm import relationship

from app.database.base import Base


class Case(Base):

    __tablename__ = "casemaster"

    case_id = Column(Integer, primary_key=True, index=True)

    fir_number = Column(String(50), unique=True, nullable=False)

    crime_type = Column(String(100), nullable=False)

    district = Column(String(100))

    police_station = Column(String(100))

    case_status = Column(String(50))

    crime_date = Column(Date)

    # KSP ER Diagram Fields
    police_person_id = Column(Integer, ForeignKey("employee.employee_id"), nullable=True)
    police_station_id = Column(Integer, ForeignKey("unit.unit_id"), nullable=True)
    case_category_id = Column(Integer, ForeignKey("casecategory.case_category_id"), nullable=True)
    gravity_offence_id = Column(Integer, ForeignKey("gravityoffence.gravity_offence_id"), nullable=True)
    crime_major_head_id = Column(Integer, ForeignKey("crimehead.crime_head_id"), nullable=True)
    crime_minor_head_id = Column(Integer, ForeignKey("crimesubhead.crime_sub_head_id"), nullable=True)
    case_status_id = Column(Integer, ForeignKey("casestatusmaster.case_status_id"), nullable=True)
    court_id = Column(Integer, ForeignKey("court.court_id"), nullable=True)
    
    incident_from_date = Column(DateTime, nullable=True)
    incident_to_date = Column(DateTime, nullable=True)
    info_received_ps_date = Column(DateTime, nullable=True)
    
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    
    brief_facts = Column(Text, nullable=True)

    # Relationships
    complainants = relationship(
        "Complainant",
        back_populates="case",
        cascade="all, delete"
    )

    victims = relationship(
        "Victim",
        back_populates="case",
        cascade="all, delete"
    )

    accused = relationship(
        "Accused",
        back_populates="case",
        cascade="all, delete"
    )

    police_person = relationship("Employee", foreign_keys=[police_person_id])
    police_station_rel = relationship("Unit", foreign_keys=[police_station_id])
    case_category = relationship("CaseCategory", foreign_keys=[case_category_id])
    gravity_offence = relationship("GravityOffence", foreign_keys=[gravity_offence_id])
    crime_major_head = relationship("CrimeHead", foreign_keys=[crime_major_head_id])
    crime_minor_head = relationship("CrimeSubHead", foreign_keys=[crime_minor_head_id])
    case_status_rel = relationship("CaseStatusMaster", foreign_keys=[case_status_id])
    court = relationship("Court", foreign_keys=[court_id])