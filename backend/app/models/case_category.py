from sqlalchemy import Column, Integer, String
from app.database.base import Base

class CaseCategory(Base):
    __tablename__ = "casecategory"

    case_category_id = Column(Integer, primary_key=True, index=True)
    lookup_value = Column(String(50), nullable=False)
