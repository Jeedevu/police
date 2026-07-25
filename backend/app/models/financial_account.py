from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class FinancialAccount(Base):

    __tablename__ = "financialaccount"

    account_id = Column(Integer, primary_key=True)

    person_id = Column(
        Integer,
        ForeignKey("personidentity.person_id")
    )

    bank_name = Column(String(100))

    account_number = Column(String(50))

    ifsc = Column(String(20))

    upi = Column(String(100))

    wallet = Column(String(100))

    person = relationship("PersonIdentity")