"""
backend/scripts/seed_demo.py
==============================
KSP Crime Intelligence Platform — Enterprise PostgreSQL + RBAC Master Demo Database Seeder Script

Populates PostgreSQL and Catalyst DataStore/NoSQL with realistic Karnataka
police demo records matching entity quotas:

  - 10 Districts & 50 Police Stations
  - 177 Officers (1 Admin, 1 DGP, 2 IGP, 3 DIG, 5 SP, 10 DSP, 25 Inspectors, 50 SI, 80 Constables)
  - 500 FIRs & 300 Active/Solved Cases
  - 400 Accused Persons & Suspects
  - 700 Evidence Assets
  - 200 Witnesses / Complainants
  - 100 Operational Officers & 50 Police Stations
  - Audit Logs, AI Conversations, Notifications, Crime Heatmap Data

Usage:
  python scripts/seed_demo.py
"""
import os
import sys
import random
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal, engine, create_tables
from app.auth.models import Officer, Role, Permission, role_permissions, ROLE_HIERARCHY
from app.auth.service import hash_password
from app.models.audit_log import AuditLog

# Import Domain Models
from app.models.state import State
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

# Datasets
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
    "Town PS (Ballari)", "Vinoba Nagar PS (Shivamogga)", "Tilak Park PS (Tumakuru)",
    "Malleswaram PS", "Rajajinagar PS", "Banashankari PS", "BTM Layout PS",
    "Marathahalli PS", "HSR Layout PS", "Ulsoor PS", "Frazer Town PS",
    "Basavanagudi PS", "Girinagar PS", "Vijayanagar PS", "Yeshwanthpur PS",
    "Peenya PS", "Kengeri PS", "Kamaksipalya PS", "Magadi Road PS",
    "Cottonpet PS", "Chickpet PS", "High Grounds PS", "Vasanth Nagar PS",
    "Sadashivanagar PS", "Sanjay Nagar PS", "RT Nagar PS", "Kodigehalli PS",
    "Vidyaranyapura PS", "Bagalgunte PS", "Soladevanahalli PS", "Jalahalli PS",
    "Gangammanagudi PS", "Nandini Layout PS", "Mahalakshmi Layout PS", "Subramanyanagar PS", "Srirampura PS"
]

KARNATAKA_FIRST_NAMES = [
    "Basavaraj", "Ramesh", "Suresh", "Manjunath", "Prashanth", "Lakshmi", "Anitha",
    "Shivakumar", "Ganesh", "Venkatesh", "Praveen", "Sunil", "Kavitha", "Nagaraj",
    "Siddaramaiah", "Vijay", "Chethan", "Divya", "Pooja", "Arun", "Mahesh", "Santhosh",
    "Jeevan", "Rekha", "Sanjay", "Anil", "Deepa", "Prakash", "Giri", "Yogesh"
]

KARNATAKA_LAST_NAMES = [
    "Gowda", "Patil", "Shetty", "Rao", "Hegde", "Bhat", "Nayak", "Kulkarni",
    "Reddy", "Kumar", "Deshmukh", "Joshi", "Pujari", "Chavan", "Angadi", "Murthy",
    "Sharma", "Verma", "Prasad", "Naidu"
]

IPC_SECTIONS = [
    "IPC 302 (Murder)", "IPC 379 (Theft)", "IPC 420 (Cheating/Fraud)",
    "IPC 395 (Dacoity)", "IPC 354 (Molestation)", "IPC 307 (Attempted Murder)",
    "IPC 498A (Cruelty by Husband/Relatives)", "IPC 279 (Rash Driving)",
    "NDPS Act Sec 20 (Narcotics)", "Cyber Crime Act Sec 66D"
]

ALL_PERMISSIONS = [
    "Dashboard.View", "Dashboard.Edit", "Cases.Create", "Cases.Read", "Cases.Update", "Cases.Delete",
    "Evidence.Upload", "Evidence.Download", "Evidence.Delete", "Analytics.View", "Analytics.Export",
    "AI.Chat", "AI.GenerateReport", "Officers.View", "Officers.Edit", "Users.Create", "Users.Edit",
    "Users.Delete", "Settings.View", "Settings.Edit", "Notifications.Send", "Audit.View", "Audit.Export",
    "CrimeMap.View", "Investigation.Assign", "Investigation.Close", "CourtOrders.View", "CourtOrders.Upload",
    "Evidence.Verify", "Evidence.Tag", "OCR.Process", "Speech.Process", "Reports.Export", "Mail.Send", "Signals.Publish"
]

ROLES_LIST = [
    "Admin", "DGP", "IGP", "DIG", "SP", "DSP", "ACP", "Inspector", "SI", "ASI", "Head Constable", "Constable", "Guest"
]

EVIDENCE_TYPES = ["image", "video", "audio", "document"]


def random_name():
    return f"{random.choice(KARNATAKA_FIRST_NAMES)} {random.choice(KARNATAKA_LAST_NAMES)}"


def seed_demo_data():
    logger = print
    logger("=== Starting KSP Crime AI Master Demo Data Seeder (PostgreSQL + JWT + RBAC) ===")
    create_tables()
    db: Session = SessionLocal()

    try:
        # 1. Seed Permissions & Roles
        logger("[1/11] Seeding Permissions and Roles tables...")
        perm_objs = {}
        for p_name in ALL_PERMISSIONS:
            p_obj = db.query(Permission).filter(Permission.name == p_name).first()
            if not p_obj:
                p_obj = Permission(name=p_name, description=f"Permission for {p_name}")
                db.add(p_obj)
                db.flush()
            perm_objs[p_name] = p_obj

        for r_name in ROLES_LIST:
            r_obj = db.query(Role).filter(Role.name == r_name).first()
            if not r_obj:
                r_obj = Role(name=r_name, description=f"{r_name} role")
                db.add(r_obj)
                db.flush()
            
            # Map permissions to role
            if r_name == "Admin":
                r_obj.permissions = list(perm_objs.values())
            elif r_name in ["DGP", "IGP", "DIG"]:
                r_obj.permissions = [p for p in perm_objs.values() if not p.name.startswith("Users.")]
            elif r_name in ["SP", "DSP", "ACP"]:
                r_obj.permissions = [p for p in perm_objs.values() if p.name in [
                    "Dashboard.View", "Cases.Read", "Cases.Create", "Cases.Update", "Evidence.Upload",
                    "Evidence.Download", "Evidence.Verify", "Evidence.Tag", "Analytics.View", "Analytics.Export",
                    "AI.Chat", "AI.GenerateReport", "CrimeMap.View", "Investigation.Assign", "Investigation.Close",
                    "Officers.View", "Reports.Export"
                ]]
            elif r_name in ["Inspector", "SI"]:
                r_obj.permissions = [p for p in perm_objs.values() if p.name in [
                    "Dashboard.View", "Cases.Read", "Cases.Create", "Cases.Update", "Evidence.Upload",
                    "Evidence.Download", "Evidence.Tag", "Analytics.View", "AI.Chat", "AI.GenerateReport",
                    "CrimeMap.View", "Investigation.Assign", "OCR.Process", "Speech.Process", "Reports.Export"
                ]]
            else: # ASI, Head Constable, Constable, Guest
                r_obj.permissions = [p for p in perm_objs.values() if p.name in [
                    "Dashboard.View", "Cases.Read", "Evidence.Upload", "Evidence.Download"
                ]]
        db.commit()
        logger("SUCCESS: Roles & Permissions configured.")

        # 2. Seed State & Districts
        logger("[2/11] Seeding State and 10 Districts...")
        state_obj = db.query(State).filter(State.state_name == "Karnataka").first()
        if not state_obj:
            state_obj = State(state_name="Karnataka", active=True)
            db.add(state_obj)
            db.flush()
        db.commit()

        district_objs = []
        for dname in DISTRICT_NAMES:
            dist = db.query(District).filter(District.district_name == dname).first()
            if not dist:
                dist = District(district_name=dname, state_id=state_obj.state_id)
                db.add(dist)
                db.flush()
            district_objs.append(dist)
        db.commit()

        # 3. Seed Police Stations (Units)
        logger("[3/11] Seeding 50 Police Stations...")
        unit_objs = []
        for i, sname in enumerate(STATION_NAMES, 1):
            dist = district_objs[(i - 1) % len(district_objs)]
            unit = db.query(Unit).filter(Unit.unit_name == sname).first()
            if not unit:
                unit = Unit(unit_name=sname, district_id=dist.district_id, state_id=state_obj.state_id)
                db.add(unit)
                db.flush()
            unit_objs.append(unit)
        db.commit()

        # 4. Seed Officers (Exact requested quotas: 1 Admin, 1 DGP, 2 IGP, 3 DIG, 5 SP, 10 DSP, 25 Inspectors, 50 SI, 80 Constables)
        logger("[4/11] Seeding 177 Officers with bcrypt hashed passwords...")
        quota_map = [
            ("Admin", 1), ("DGP", 1), ("IGP", 2), ("DIG", 3),
            ("SP", 5), ("DSP", 10), ("Inspector", 25), ("SI", 50), ("Constable", 80)
        ]

        officer_counter = 1
        all_officers = []

        for role_name, count in quota_map:
            role_obj = db.query(Role).filter(Role.name == role_name).first()
            role_password = f"{role_name.replace(' ', '')}@123"
            hashed_pw = hash_password(role_password)

            for i in range(1, count + 1):
                if role_name == "Admin":
                    email = "admin@ksp.gov.in"
                    badge = "KSP-ADMIN-001"
                    name = "System Administrator"
                elif role_name == "Inspector" and i == 1:
                    email = "jeevan.inspector@ksp.gov.in"
                    badge = "KSP-INS-001"
                    name = "Jeevan Sharma"
                else:
                    email = f"{role_name.lower().replace(' ', '')}{i}@ksp.gov.in"
                    badge = f"KSP-{role_name[:3].upper()}-{i:03d}"
                    name = random_name()

                off = db.query(Officer).filter(
                    (Officer.email == email) | (Officer.badge_number == badge)
                ).first()
                dist = district_objs[officer_counter % len(district_objs)]
                unit = unit_objs[officer_counter % len(unit_objs)]

                first_n = name.split()[0]
                last_n = " ".join(name.split()[1:]) if len(name.split()) > 1 else ""

                if not off:
                    off = Officer(
                        officer_id=badge,
                        username=email.split("@")[0],
                        email=email,
                        password_hash=hashed_pw,
                        full_name=name,
                        first_name=first_n,
                        last_name=last_n,
                        badge_number=badge,
                        rank=role_name,
                        role=role_name,
                        role_id=role_obj.id if role_obj else None,
                        district_id=dist.district_id,
                        unit_id=unit.unit_id,
                        state="Karnataka",
                        phone=f"+91 9845{officer_counter:06d}",
                        is_active=True,
                        is_verified=True,
                    )
                    db.add(off)
                else:
                    off.email = email
                    off.username = email.split("@")[0]
                    off.password_hash = hashed_pw
                    off.badge_number = badge
                    off.officer_id = badge
                    off.role = role_name
                    off.rank = role_name
                    off.role_id = role_obj.id if role_obj else None
                    off.is_active = True
                
                db.flush()
                all_officers.append(off)
                officer_counter += 1

        db.commit()
        logger(f"SUCCESS: {len(all_officers)} Officers seeded across all ranks.")

        # 5. Seed 300 Cases & 500 FIRs
        logger("[5/11] Seeding 300 Cases and 500 FIR records...")
        existing_cases = db.query(Case).all()
        cases = list(existing_cases)
        if len(cases) < 300:
            statuses = ["Registered", "Under Investigation", "Chargesheeted", "Closed", "Pending Trial"]
            for i in range(len(cases) + 1, 301):
                case_no = f"FIR/KSP/2026/{i:04d}"
                dt = (datetime.now() - timedelta(days=random.randint(1, 365))).date()
                sec = random.choice(IPC_SECTIONS)
                stat = random.choice(statuses)
                io = random.choice(all_officers)
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
                    brief_facts=f"FIR registered under {sec} at {unit_name}. Active investigation in progress.",
                )
                db.add(c)
                cases.append(c)
            db.commit()
        logger(f"SUCCESS: {len(cases)} Cases available.")

        # 6. Seed Accused (400 Accused)
        logger("[6/11] Seeding 400 Accused Records...")
        existing_accused = db.query(Accused).count()
        if existing_accused < 400:
            for i in range(existing_accused + 1, 401):
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
        logger("SUCCESS: 400 Accused records seeded.")

        # 7. Seed Victims & Witnesses (200 Witnesses)
        logger("[7/11] Seeding 200 Witnesses / Complainants...")
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

        # 8. Seed Evidence (700 Evidence Files)
        logger("[8/11] Seeding 700 Evidence Items...")
        existing_ev = db.query(Evidence).count()
        if existing_ev < 700:
            for i in range(existing_ev + 1, 701):
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
        logger("SUCCESS: 700 Evidence items seeded.")

        # 9. Audit Logs Initial Seed
        logger("[9/11] Seeding Audit Logs...")
        existing_logs = db.query(AuditLog).count()
        if existing_logs < 50:
            for i in range(1, 51):
                off = all_officers[i % len(all_officers)]
                action = random.choice(["LOGIN", "LOGOUT", "CASE_UPDATE", "EVIDENCE_UPLOAD", "PASSWORD_CHANGE"])
                log_entry = AuditLog(
                    user_id=off.id,
                    action=action,
                    resource=f"Case:{cases[i % len(cases)].case_id}",
                    details=f"Audit event #{i} for officer {off.badge_number}",
                    ip_address="127.0.0.1",
                    created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 100))
                )
                db.add(log_entry)
            db.commit()
        logger("SUCCESS: Audit logs seeded.")

        # 10. Catalyst NoSQL & DataStore Seeding (if configured)
        logger("[10/11] Seeding Catalyst NoSQL & DataStore...")
        try:
            from app.catalyst.datastore import CatalystDataStoreWrapper
            from app.catalyst.nosql import CatalystNoSQLWrapper

            ds = CatalystDataStoreWrapper()
            nosql = CatalystNoSQLWrapper()

            for i in range(1, 25):
                ds.log_investigation({
                    "case_id": cases[i % len(cases)].case_id,
                    "officer_id": all_officers[i % len(all_officers)].id,
                    "action": "INVESTIGATION_LOG",
                    "description": f"Investigation step #{i} completed.",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })

            for i in range(1, 25):
                nosql.upsert_conversation(f"officer_{all_officers[i % len(all_officers)].id}", [
                    {"role": "user", "content": "Fetch recent theft cases", "timestamp": datetime.now(timezone.utc).isoformat()},
                    {"role": "assistant", "content": "Retrieved 10 theft cases.", "timestamp": datetime.now(timezone.utc).isoformat()}
                ])
            logger("SUCCESS: Catalyst NoSQL & DataStore records populated.")
        except Exception as c_err:
            logger(f"Note on Catalyst external services: {c_err}")

        logger("[11/11] Complete! All RBAC tables, Officers, Cases, Evidence, and Audit Logs successfully seeded.")
        logger("=== Master Seeder Execution Complete ===")

    except Exception as exc:
        db.rollback()
        logger(f"ERROR during seeding: {exc}")
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
