from sqlalchemy import Column, Integer, String, ForeignKey, ForeignKeyConstraint
from app.database.base import Base

class ActSectionAssociation(Base):
    __tablename__ = "actsectionassociation"

    case_master_id = Column(Integer, ForeignKey("casemaster.case_id"), primary_key=True)
    act_id = Column(String(50), primary_key=True)
    section_id = Column(String(50), primary_key=True)
    act_order_id = Column(Integer)
    section_order_id = Column(Integer)

    __table_args__ = (
        ForeignKeyConstraint(
            ['act_id', 'section_id'],
            ['section.act_code', 'section.section_code']
        ),
    )
