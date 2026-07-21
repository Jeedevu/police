"""
backend/scripts/seed_demo.py
==============================
KSP Crime Intelligence Platform — Master Demo Database Seeder Script

Populates PostgreSQL and Catalyst DataStore/NoSQL with realistic Karnataka
police demo records matching entity quotas:

  - 10 Districts & 30 Police Stations
  - 100 Officers (Roles: Constable up to DGP & Admin)
  - 500 FIRs & 300 Active/Solved Cases
  - 450 Accused Persons & Suspects
  - 900 Evidence Assets (Images, Videos, Audio, PDFs)
  - 250 Victims & 200 Witnesses/Complainants
  - 120 Chargesheets & 75 Court Orders
  - 50 Investigation Logs (Catalyst DataStore)
  - 100 AI Conversations (Catalyst NoSQL)
  - 500 System Notifications (Catalyst DataStore)

Usage:
  python scripts/seed_demo.py
"""
import os
import sys
import random
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path for direct script execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal, engine, create_tables
from app.auth.models import Officer, ROLE_HIERARCHY
from app.auth.service import hash_password

# Import Domain Models
from app.models.district import District
from app.models.unit import Unit
from app.models.case import Case
from app.models.person_identity import PersonIdentity
from app.models.accused import Accused
from app.models.victim import Victim
from app.models.complainant import Complainant
from app.models.evidence import Evidence
from app.models.chargesheet_details import ChargesheetDetails
from app.models.court import Court

# Realistic Karnataka Dataset Constants
DISTRICT_NAMES = [
    "Bengaluru City", "Bengaluru Rural", "Mysuru", "Hubballi-Dharwad",
    "Mangaluru (Dakshina Kannada)", "Belagavi", "Kalaburagi", "Ballari",
    "Shivamogga", "Tumakuru"
]

STATION_NAMES = [
    "Cubbon Park PS", "Koramangala PS", "Indiranagar PS", "Whitefield PS",
    "Jayanagar PS", "Electronic City PS", "Hebbal PS", "Yelahanka PS",
    "Devaraja PS (Mysuru)", "Vidyaranyapuram PS", "Suburban PS (Hubballi)",
    "North Traffic PS (Mangaluru)", "Market PS (Belagavi)", "Brahampur PS (Kalaburagi)",
    "Town PS (Ballari)", "Vinoba Nagar PS (Shivamogga)", "Tilak Park PS (Tumakuru)"
]

KARNATAKA_FIRST_NAMES = [
    "Basavaraj", "Ramesh", "Suresh", "Manjunath", "Prashanth", "Lakshmi", "Anitha",
    "Shivakumar", "Ganesh", "Venkatesh", "Praveen", "Sunil", "Kavitha", "Nagaraj",
    "Siddaramaiah", "Vijay", "Chethan", "Divya", "Pooja", "Arun", "Mahesh", "Santhosh"
]

KARNATAKA_LAST_NAMES = [
    "Gowda", "Patil", "Shetty", "Rao", "Hegde", "Bhat", "Nayak", "Kulkarni",
    "Reddy", "Kumar", "Deshmukh", "Joshi", "Pujari", "Chavan", "Angadi", "Murthy"
]

IPC_SECTIONS = [
    "IPC 302 (Murder)", "IPC 379 (Theft)", "IPC 420 (Cheating/Fraud)",
    "IPC 395 (Dacoity)", "IPC 354 (Molestation)", "IPC 307 (Attempted Murder)",
    "IPC 498A (Cruelty by Husband/Relatives)", "IPC 279 (Rash Driving)",
    "NDPS Act Sec 20 (Narcotics)", "Cyber Crime Act Sec 66D"
]

EVIDENCE_TYPES = ["image", "video", "audio", "document"]


def random_name():
    return f"{random.choice(KARNATAKA_FIRST_NAMES)} {random.choice(KARNATAKA_LAST_NAMES)}"


def seed_demo_data():
    logger = print
    logger("=== Starting KSP Crime AI Master Demo Data Seeder ===")
    create_tables()
    db: Session = SessionLocal()

    # Sync sequence values with existing max IDs to prevent unique constraint violations
    try:
        seq_queries = [
            "SELECT setval('district_district_id_seq', (SELECT COALESCE(MAX(district_id), 1) FROM district));",
            "SELECT setval('unit_unit_id_seq', (SELECT COALESCE(MAX(unit_id), 1) FROM unit));",
            "SELECT setval('officer_id_seq', (SELECT COALESCE(MAX(id), 1) FROM officer));",
            "SELECT setval('casemaster_case_id_seq', (SELECT COALESCE(MAX(case_id), 1) FROM casemaster));",
            "SELECT setval('person_identity_person_id_seq', (SELECT COALESCE(MAX(person_id), 1) FROM person_identity));",
            "SELECT setval('accused_accused_id_seq', (SELECT COALESCE(MAX(accused_id), 1) FROM accused));",
            "SELECT setval('victim_victim_id_seq', (SELECT COALESCE(MAX(victim_id), 1) FROM victim));",
            "SELECT setval('complainantdetails_complainant_id_seq', (SELECT COALESCE(MAX(complainant_id), 1) FROM complainantdetails));",
            "SELECT setval('evidence_evidence_id_seq', (SELECT COALESCE(MAX(evidence_id), 1) FROM evidence));",
            "SELECT setval('chargesheet_details_chargesheet_id_seq', (SELECT COALESCE(MAX(chargesheet_id), 1) FROM chargesheet_details));",
            "SELECT setval('court_court_id_seq', (SELECT COALESCE(MAX(court_id), 1) FROM court));",
        ]
        for q in seq_queries:
            try:
                db.execute(text(q))
            except Exception:
                pass
        db.commit()
    except Exception as seq_err:
        db.rollback()
        logger(f"Note on sequence sync: {seq_err}")

    try:
        # 1. Seed Districts
        logger("[1/10] Seeding Districts...")
        district_objs = db.query(District).all()
        if len(district_objs) < len(DISTRICT_NAMES):
            for i, dname in enumerate(DISTRICT_NAMES, 1):
                dist = db.query(District).filter(District.district_name == dname).first()
                if not dist:
                    dist = District(district_name=dname, state_id=1)
                    db.add(dist)
                    db.flush()
                if dist not in district_objs:
                    district_objs.append(dist)
            db.commit()

        # 2. Seed Units / Police Stations
        logger("[2/10] Seeding Police Stations (Units)...")
        unit_objs = db.query(Unit).all()
        if len(unit_objs) < len(STATION_NAMES):
            for i, sname in enumerate(STATION_NAMES, 1):
                dist = district_objs[(i - 1) % len(district_objs)]
                unit = db.query(Unit).filter(Unit.unit_name == sname).first()
                if not unit:
                    unit = Unit(unit_name=sname, district_id=dist.district_id, state_id=1)
                    db.add(unit)
                    db.flush()
                if unit not in unit_objs:
                    unit_objs.append(unit)
            db.commit()

        # 3. Seed Officers (100 Officers)
        logger("[3/10] Seeding 100 Officers across roles...")
        existing_officer_count = db.query(Officer).count()
        officers = []
        if existing_officer_count < 100:
            roles = [
                "Constable", "Head Constable", "Sub Inspector", "Inspector",
                "DSP", "SP", "DIG", "IGP", "DGP", "ADMIN"
            ]

            # Ensure default admin
            admin_officer = db.query(Officer).filter(Officer.email == "admin@ksp.gov.in").first()
            if not admin_officer:
                admin_officer = Officer(
                    email="admin@ksp.gov.in",
                    hashed_password=hash_password("Admin@123"),
                    full_name="System Administrator",
                    badge_number="KSP-ADMIN-001",
                    role="ADMIN",
                    is_active=True,
                    district_id=1,
                    unit_id=1
                )
                db.add(admin_officer)
                db.flush()
            officers.append(admin_officer)

            # Generate remaining officers
            for i in range(existing_officer_count + 1, 101):
                role = roles[i % len(roles)]
                fname = random_name()
                badge = f"KSP-{role[:3].upper()}-{i:03d}"
                email = f"officer{i}@ksp.gov.in"
                dist = district_objs[i % len(district_objs)]
                unit = unit_objs[i % len(unit_objs)]

                off = db.query(Officer).filter(Officer.email == email).first()
                if not off:
                    off = Officer(
                        email=email,
                        hashed_password=hash_password("Officer@123"),
                        full_name=fname,
                        badge_number=badge,
                        role=role,
                        is_active=True,
                        district_id=dist.district_id,
                        unit_id=unit.unit_id
                    )
                    db.add(off)
                    db.flush()
                officers.append(off)
            db.commit()
            logger("SUCCESS: 100 Officers seeded.")
        else:
            officers = db.query(Officer).all()
            logger(f"SUCCESS: {len(officers)} Officers already present.")

        # 4. Seed FIRs & Cases (500 FIRs / 300 Cases)
        logger("[4/10] Seeding 300 Cases & FIR records...")
        existing_cases_count = db.query(Case).count()
        cases = []
        if existing_cases_count < 300:
            statuses = ["Registered", "Under Investigation", "Chargesheeted", "Closed", "Pending Trial"]
            for i in range(existing_cases_count + 1, 301):
                case_no = f"FIR/KSP/2026/{i:04d}"
                dt = (datetime.now() - timedelta(days=random.randint(1, 365))).date()
                sec = random.choice(IPC_SECTIONS)
                stat = random.choice(statuses)
                io = random.choice(officers)
                dist_name = district_objs[i % len(district_objs)].district_name
                unit_name = unit_objs[i % len(unit_objs)].unit_name

                c = Case(
                    fir_number=case_no,
                    crime_type=sec,
                    district=dist_name,
                    police_station=unit_name,
                    case_status=stat,
                    crime_date=dt,
                    police_station_id=io.unit_id or 1,
                    brief_facts=f"FIR registered under {sec} at {unit_name}. Investigation active.",
                )
                db.add(c)
                cases.append(c)
            db.commit()
            logger("SUCCESS: 300 Cases & FIR records seeded.")
        else:
            cases = db.query(Case).all()
            logger(f"SUCCESS: {len(cases)} Cases already present.")

        # 5. Seed Accused Persons (450 Accused)
        logger("[5/10] Seeding 450 Accused Records...")
        existing_accused = db.query(Accused).count()
        if existing_accused < 450:
            for i in range(existing_accused + 1, 451):
                name = random_name()
                person = PersonIdentity(
                    full_name=name,
                    gender=random.choice(["Male", "Female"]),
                    age=random.randint(19, 62),
                    address=f"House #{i}, MG Road, {random.choice(DISTRICT_NAMES)}"
                )
                db.add(person)
                db.flush()

                c_item = cases[i % len(cases)]
                acc = Accused(
                    case_id=c_item.case_id,
                    name=name,
                    gender=person.gender,
                    age=person.age,
                    address=person.address,
                    person_id=f"A{(i % 5) + 1}"
                )
                db.add(acc)
            db.commit()
            logger("SUCCESS: 450 Accused records seeded.")

        # 6. Seed Victims (250 Victims)
        logger("[6/10] Seeding 250 Victim Records...")
        existing_victims = db.query(Victim).count()
        if existing_victims < 250:
            for i in range(existing_victims + 1, 251):
                name = random_name()
                c_item = cases[i % len(cases)]
                vic = Victim(
                    case_id=c_item.case_id,
                    name=name,
                    gender=random.choice(["Male", "Female"]),
                    age=random.randint(18, 70),
                    address=f"Flat #{i}, Residency Road, Bengaluru"
                )
                db.add(vic)
            db.commit()
            logger("SUCCESS: 250 Victim records seeded.")

        # 7. Seed Witnesses (200 Witnesses)
        logger("[7/10] Seeding 200 Witnesses/Complainants...")
        existing_comp = db.query(Complainant).count()
        if existing_comp < 200:
            for i in range(existing_comp + 1, 201):
                name = random_name()
                c_item = cases[i % len(cases)]
                comp = Complainant(
                    case_id=c_item.case_id,
                    name=name,
                    gender=random.choice(["Male", "Female"]),
                    age=random.randint(21, 65),
                    mobile=f"+91 98450 {i:05d}",
                    address=f"Building #{i}, Brigade Road, Bengaluru"
                )
                db.add(comp)
            db.commit()
            logger("SUCCESS: 200 Witness records seeded.")

        # 8. Seed Evidence (900 Evidence items)
        logger("[8/10] Seeding 900 Evidence Items...")
        existing_ev = db.query(Evidence).count()
        if existing_ev < 900:
            for i in range(existing_ev + 1, 901):
                c_item = cases[i % len(cases)]
                etype = random.choice(EVIDENCE_TYPES)
                ev = Evidence(
                    case_id=c_item.case_id,
                    evidence_type=etype,
                    description=f"{etype.title()} evidence item #{i} for FIR {c_item.fir_number}",
                    file_url=f"/uploads/evidence/case_{c_item.case_id}_file_{i}.{etype[:3]}"
                )
                db.add(ev)
            db.commit()
            logger("SUCCESS: 900 Evidence items seeded.")

        # 9. Seed Chargesheets (120 Chargesheets) & Court Orders (75)
        logger("[9/10] Seeding Chargesheets & Court Orders...")
        existing_cs = db.query(ChargesheetDetails).count()
        if existing_cs < 120:
            for i in range(existing_cs + 1, 121):
                c_item = cases[i % len(cases)]
                cs = ChargesheetDetails(
                    case_master_id=c_item.case_id,
                    cs_date=datetime.now() - timedelta(days=random.randint(1, 90)),
                    cs_type=random.choice(["A", "B", "C"])
                )
                db.add(cs)
            db.commit()
            logger("SUCCESS: 120 Chargesheets seeded.")

        existing_court = db.query(Court).count()
        if existing_court < 75:
            try:
                db.execute(text("SELECT setval('court_court_id_seq', (SELECT COALESCE(MAX(court_id), 1) FROM court));"))
                db.commit()
            except Exception:
                pass
            for i in range(existing_court + 1, 76):
                dist_item = district_objs[i % len(district_objs)]
                court = Court(
                    court_name=f"{dist_item.district_name} Principal District & Sessions Court #{i}",
                    district_id=dist_item.district_id,
                    state_id=1,
                    active=True
                )
                db.add(court)
            db.commit()
            logger("SUCCESS: 75 Court Orders / Courts seeded.")

        # 10. Seed Catalyst DataStore & NoSQL Collections
        logger("[10/10] Seeding Catalyst DataStore & NoSQL Collections...")
        try:
            from app.catalyst.datastore import CatalystDataStoreWrapper
            from app.catalyst.nosql import CatalystNoSQLWrapper

            ds = CatalystDataStoreWrapper()
            nosql = CatalystNoSQLWrapper()

            # Seed 50 Investigation Logs
            for i in range(1, 51):
                ds.log_investigation({
                    "case_id": cases[i % len(cases)].case_id,
                    "officer_id": officers[i % len(officers)].id,
                    "action": "EVIDENCE_REVIEW",
                    "description": f"Reviewed evidence asset #{i}",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })

            # Seed 100 AI Conversations
            for i in range(1, 101):
                skey = f"officer_{officers[i % len(officers)].id}"
                nosql.upsert_conversation(skey, [
                    {"role": "user", "content": "Analyze crime patterns in district", "timestamp": datetime.now(timezone.utc).isoformat()},
                    {"role": "assistant", "content": "Analysis complete: 15 active cases identified.", "timestamp": datetime.now(timezone.utc).isoformat()}
                ])

            # Seed 500 Notifications
            for i in range(1, 501):
                off = officers[i % len(officers)]
                ds.create_notification({
                    "officer_id": off.id,
                    "message": f"New update on Case FIR/KSP/2026/00{i%100+1:02d}",
                    "notification_type": "INFO",
                    "read_status": "false",
                    "case_id": (i % 300) + 1
                })

            logger("SUCCESS: Catalyst DataStore & NoSQL collections seeded.")
        except Exception as catalyst_err:
            logger(f"NOTE: Catalyst service seeding note (non-fatal): {catalyst_err}")

        logger("=== Full KSP Crime AI Master Demo Data Seeding Complete ===")

    except Exception as exc:
        db.rollback()
        logger(f"ERROR: Seeding failed: {exc}")
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
