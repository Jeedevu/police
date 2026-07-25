from sqlalchemy import Column, Integer, String, ForeignKey, ForeignKeyConstraint
from app.database.base import Base

class CrimeHeadActSection(Base):
    __tablename__ = "crimeheadactsection"

    crime_head_id = Column(Integer, ForeignKey("crimehead.crime_head_id"), primary_key=True)
    act_code = Column(String(50), primary_key=True)
    section_code = Column(String(50), primary_key=True)

    __table_args__ = (
        ForeignKeyConstraint(
            ['act_code', 'section_code'],
            ['section.act_code', 'section.section_code']
        ),
    )
