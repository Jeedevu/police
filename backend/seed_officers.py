"""
Seed script for officer accounts — creates demo officers for all 14 roles.
Run: python seed_officers.py (from backend directory)
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database.connection import SessionLocal, create_tables
from app.auth.models import Officer
from app.auth.service import hash_password

DEMO_OFFICERS = [
    {
        "email": "admin@ksp.gov.in",
        "password": "Admin@123",
        "full_name": "System Administrator",
        "badge_number": "KSP-ADMIN-001",
        "role": "ADMIN",
    },
    {
        "email": "dgp@ksp.gov.in",
        "password": "Officer@123",
        "full_name": "K. Rajendra Prasad",
        "badge_number": "KSP-DGP-001",
        "role": "DGP",
    },
    {
        "email": "adgp.south@ksp.gov.in",
        "password": "Officer@123",
        "full_name": "S. Venkatesh Kumar",
        "badge_number": "KSP-ADGP-001",
        "role": "ADGP",
        "zone_id": 1,
    },
    {
        "email": "igp.bengaluru@ksp.gov.in",
        "password": "Officer@123",
        "full_name": "M. Nagraj",
        "badge_number": "KSP-IGP-001",
        "role": "IGP",
        "district_id": 1,
    },
    {
        "email": "dig.bengaluru@ksp.gov.in",
        "password": "Officer@123",
        "full_name": "P. Chandrashekar",
        "badge_number": "KSP-DIG-001",
        "role": "DIG",
        "district_id": 1,
    },
    {
        "email": "sp.bengaluru@ksp.gov.in",
        "password": "Officer@123",
        "full_name": "Arun Kumar Singh",
        "badge_number": "KSP-SP-001",
        "role": "SP",
        "district_id": 1,
    },
    {
        "email": "sp.mysuru@ksp.gov.in",
        "password": "Officer@123",
        "full_name": "Ramesh Hegde",
        "badge_number": "KSP-SP-002",
        "role": "SP",
        "district_id": 2,
    },
    {
        "email": "dsp.south@ksp.gov.in",
        "password": "Officer@123",
        "full_name": "Priya Sharma",
        "badge_number": "KSP-DSP-001",
        "role": "DSP",
        "district_id": 1,
        "unit_id": 1,
    },
    {
        "email": "acp.koramangala@ksp.gov.in",
        "password": "Officer@123",
        "full_name": "Suresh Gowda",
        "badge_number": "KSP-ACP-001",
        "role": "ACP",
        "district_id": 1,
        "unit_id": 2,
    },
    {
        "email": "inspector.hsr@ksp.gov.in",
        "password": "Officer@123",
        "full_name": "Vikram Rathore",
        "badge_number": "KSP-INS-001",
        "role": "Inspector",
        "district_id": 1,
        "unit_id": 3,
    },
    {
        "email": "si.jayanagar@ksp.gov.in",
        "password": "Officer@123",
        "full_name": "Kavitha Nair",
        "badge_number": "KSP-SI-001",
        "role": "Sub Inspector",
        "district_id": 1,
        "unit_id": 4,
    },
    {
        "email": "hc.btm@ksp.gov.in",
        "password": "Officer@123",
        "full_name": "Mahesh Patil",
        "badge_number": "KSP-HC-001",
        "role": "Head Constable",
        "district_id": 1,
        "unit_id": 5,
    },
    {
        "email": "constable.001@ksp.gov.in",
        "password": "Officer@123",
        "full_name": "Ravi Kumar",
        "badge_number": "KSP-CON-001",
        "role": "Constable",
        "district_id": 1,
        "unit_id": 5,
    },
    {
        "email": "analyst@ksp.gov.in",
        "password": "Officer@123",
        "full_name": "Deepa Menon",
        "badge_number": "KSP-ANL-001",
        "role": "Analyst",
    },
    {
        "email": "guest@ksp.gov.in",
        "password": "Officer@123",
        "full_name": "Guest User",
        "badge_number": "KSP-GST-001",
        "role": "Guest",
    },
]


def seed_officers():
    print("Creating tables...")
    create_tables()

    db = SessionLocal()
    try:
        created = 0
        skipped = 0

        for data in DEMO_OFFICERS:
            existing = db.query(Officer).filter(Officer.email == data["email"]).first()
            if existing:
                skipped += 1
                print(f"  [Skipped] (exists): {data['email']}")
                continue

            officer = Officer(
                email=data["email"],
                hashed_password=hash_password(data["password"]),
                full_name=data["full_name"],
                badge_number=data["badge_number"],
                role=data["role"],
                district_id=data.get("district_id"),
                unit_id=data.get("unit_id"),
                zone_id=data.get("zone_id"),
                is_active=True,
            )
            db.add(officer)
            created += 1
            print(f"  [Created]: {data['full_name']} ({data['role']}) - {data['email']}")

        db.commit()
        print(f"\nDone! Created: {created}, Skipped: {skipped}")
        print("\nDemo login credentials:")
        print("  Admin:     admin@ksp.gov.in / Admin@123")
        print("  SP:        sp.bengaluru@ksp.gov.in / Officer@123")
        print("  Inspector: inspector.hsr@ksp.gov.in / Officer@123")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_officers()
