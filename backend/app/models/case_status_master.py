from sqlalchemy import Column, Integer, String
from app.database.base import Base

class CaseStatusMaster(Base):
    __tablename__ = "casestatusmaster"

    case_status_id = Column(Integer, primary_key=True, index=True)
    case_status_name = Column(String(50), nullable=False)
