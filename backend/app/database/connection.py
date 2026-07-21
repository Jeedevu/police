from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from pathlib import Path
from app.models.criminal_history import CriminalHistory
from app.models.known_associate import KnownAssociate
from app.models.vehicle import Vehicle
from app.models.phone import Phone
from app.models.evidence import Evidence
from app.models.financial_account import FinancialAccount

from app.models.investigation_officer import InvestigationOfficer
from app.models.person_identity import PersonIdentity
from app.models.case import Case
from app.models.complainant import Complainant
from app.models.victim import Victim
from app.models.accused import Accused

# KSP ER Diagram Models
from app.models.state import State
from app.models.district import District
from app.models.unit_type import UnitType
from app.models.unit import Unit
from app.models.rank import Rank
from app.models.designation import Designation
from app.models.employee import Employee
from app.models.case_category import CaseCategory
from app.models.gravity_offence import GravityOffence
from app.models.crime_head import CrimeHead
from app.models.crime_sub_head import CrimeSubHead
from app.models.case_status_master import CaseStatusMaster
from app.models.court import Court
from app.models.caste_master import CasteMaster
from app.models.religion_master import ReligionMaster
from app.models.occupation_master import OccupationMaster
from app.models.act import Act
from app.models.section import Section
from app.models.act_section_association import ActSectionAssociation
from app.models.crime_head_act_section import CrimeHeadActSection
from app.models.chargesheet_details import ChargesheetDetails
from app.models.arrest_surrender import ArrestSurrender
import os

# Auth models (v2.0) — must be imported before create_all
from app.auth.models import Officer  # noqa: F401

from app.database.base import Base

BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)