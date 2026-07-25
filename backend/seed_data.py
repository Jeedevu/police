import datetime
from sqlalchemy import text
from app.database.connection import engine, SessionLocal

# Import existing models
from app.models.case import Case
from app.models.person_identity import PersonIdentity
from app.models.accused import Accused
from app.models.victim import Victim
from app.models.complainant import Complainant
from app.models.criminal_history import CriminalHistory
from app.models.evidence import Evidence
from app.models.vehicle import Vehicle
from app.models.phone import Phone
from app.models.known_associate import KnownAssociate
from app.models.investigation_officer import InvestigationOfficer
from app.models.financial_account import FinancialAccount

# Import new KSP models
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


def seed():
    db = SessionLocal()
    try:
        # Clear existing tables (cascade order)
        tables_to_truncate = [
            "criminalhistory", "evidence", "vehicle", "phone", "knownassociate", 
            "financialaccount", "accused", "victim", "complainantdetails", 
            "actsectionassociation", "chargesheetdetails", "arrestsurrender", 
            "casemaster", "employee", "unit", "unittype", "district", "state", 
            "rank", "designation", "casecategory", "gravityoffence", 
            "crimeheadactsection", "crimesubhead", "crimehead", "casestatusmaster", 
            "court", "castemaster", "religionmaster", "occupationmaster", 
            "section", "act", "personidentity", "investigationofficer"
        ]
        truncate_query = f"TRUNCATE TABLE {', '.join(tables_to_truncate)} RESTART IDENTITY CASCADE;"
        db.execute(text(truncate_query))
        db.commit()
        print("Cleared existing database data.")

        # 1. Seed State
        karnataka = State(state_id=1, state_name="Karnataka", nationality_id=1, active=True)
        db.add(karnataka)
        db.commit()

        # 2. Seed Districts
        districts = [
            District(district_id=1, district_name="Bengaluru", state_id=1, active=True),
            District(district_id=2, district_name="Mysuru", state_id=1, active=True),
            District(district_id=3, district_name="Hubballi", state_id=1, active=True),
            District(district_id=4, district_name="Mangaluru", state_id=1, active=True)
        ]
        db.add_all(districts)
        db.commit()

        # 3. Seed Unit Types
        ps_type = UnitType(unit_type_id=1, unit_type_name="Police Station", city_dist_state="District", hierarchy=3, active=True)
        db.add(ps_type)
        db.commit()

        # 4. Seed Units (Police Stations)
        units = [
            Unit(unit_id=1, unit_name="Koramangala PS", type_id=1, state_id=1, district_id=1, active=True),
            Unit(unit_id=2, unit_name="Whitefield PS", type_id=1, state_id=1, district_id=1, active=True),
            Unit(unit_id=3, unit_name="Mysuru Central PS", type_id=1, state_id=1, district_id=2, active=True),
            Unit(unit_id=4, unit_name="Hubballi City PS", type_id=1, state_id=1, district_id=3, active=True),
            Unit(unit_id=5, unit_name="Mangaluru North PS", type_id=1, state_id=1, district_id=4, active=True)
        ]
        db.add_all(units)
        db.commit()

        # 5. Seed Ranks & Designations
        ranks = [
            Rank(rank_id=1, rank_name="Inspector", hierarchy=2, active=True),
            Rank(rank_id=2, rank_name="PSI", hierarchy=3, active=True),
            Rank(rank_id=3, rank_name="DSP", hierarchy=1, active=True),
            Rank(rank_id=4, rank_name="Constable", hierarchy=5, active=True)
        ]
        designations = [
            Designation(designation_id=1, designation_name="Investigating Officer", active=True, sort_order=1),
            Designation(designation_id=2, designation_name="SHO", active=True, sort_order=2)
        ]
        db.add_all(ranks)
        db.add_all(designations)
        db.commit()

        # 6. Seed Employees (Police Staff)
        employees = [
            Employee(employee_id=1, district_id=1, unit_id=1, rank_id=1, designation_id=1, kgid="IB1029", first_name="Inspecter Patil", employee_dob=datetime.date(1980, 5, 12), gender_id=1, appointment_date=datetime.date(2005, 8, 1)),
            Employee(employee_id=2, district_id=1, unit_id=2, rank_id=2, designation_id=1, kgid="IB5049", first_name="PSI Harish", employee_dob=datetime.date(1988, 11, 4), gender_id=1, appointment_date=datetime.date(2012, 10, 15)),
            Employee(employee_id=3, district_id=2, unit_id=3, rank_id=3, designation_id=1, kgid="IB0023", first_name="DSP Venkatesh", employee_dob=datetime.date(1975, 2, 20), gender_id=1, appointment_date=datetime.date(1998, 4, 1)),
            Employee(employee_id=4, district_id=3, unit_id=4, rank_id=2, designation_id=1, kgid="IB9082", first_name="PSI Kavitha", employee_dob=datetime.date(1992, 7, 22), gender_id=2, appointment_date=datetime.date(2018, 6, 1))
        ]
        db.add_all(employees)
        db.commit()

        # Seed old investigationofficer table for backward compatibility
        officers = [
            InvestigationOfficer(officer_id=1, name="Inspecter Patil", rank="Inspector", badge_number="IB1029", police_station="Koramangala PS"),
            InvestigationOfficer(officer_id=2, name="PSI Harish", rank="PSI", badge_number="IB5049", police_station="Whitefield PS"),
            InvestigationOfficer(officer_id=3, name="DSP Venkatesh", rank="DSP", badge_number="IB0023", police_station="Mysuru Central PS"),
            InvestigationOfficer(officer_id=4, name="PSI Kavitha", rank="PSI", badge_number="IB9082", police_station="Hubballi City PS")
        ]
        db.add_all(officers)
        db.commit()

        # 7. Seed Demographic Masters
        castes = [CasteMaster(caste_master_id=1, caste_master_name="General")]
        religions = [
            ReligionMaster(religion_id=1, religion_name="Hindu"),
            ReligionMaster(religion_id=2, religion_name="Muslim"),
            ReligionMaster(religion_id=3, religion_name="Christian")
        ]
        occupations = [
            OccupationMaster(occupation_id=1, occupation_name="Driver"),
            OccupationMaster(occupation_id=2, occupation_name="Mechanic"),
            OccupationMaster(occupation_id=3, occupation_name="Contractor"),
            OccupationMaster(occupation_id=4, occupation_name="IT Manager"),
            OccupationMaster(occupation_id=5, occupation_name="Shopkeeper"),
            OccupationMaster(occupation_id=6, occupation_name="Student")
        ]
        db.add_all(castes)
        db.add_all(religions)
        db.add_all(occupations)
        db.commit()

        # 8. Seed Case Categorization & Status
        categories = [
            CaseCategory(case_category_id=1, lookup_value="FIR"),
            CaseCategory(case_category_id=2, lookup_value="UDR")
        ]
        gravities = [
            GravityOffence(gravity_offence_id=1, lookup_value="Heinous"),
            GravityOffence(gravity_offence_id=2, lookup_value="Non-Heinous")
        ]
        statuses = [
            CaseStatusMaster(case_status_id=1, case_status_name="Pending"),
            CaseStatusMaster(case_status_id=2, case_status_name="Under Investigation"),
            CaseStatusMaster(case_status_id=3, case_status_name="Solved"),
            CaseStatusMaster(case_status_id=4, case_status_name="Closed")
        ]
        db.add_all(categories)
        db.add_all(gravities)
        db.add_all(statuses)
        db.commit()

        # 9. Seed Courts
        courts = [
            Court(court_id=1, court_name="Bengaluru Metropolitan Magistrate Court", district_id=1, state_id=1, active=True),
            Court(court_id=2, court_name="Mysuru District & Sessions Court", district_id=2, state_id=1, active=True),
            Court(court_id=3, court_name="Hubballi City Civil Court", district_id=3, state_id=1, active=True)
        ]
        db.add_all(courts)
        db.commit()

        # 10. Seed Crime Heads
        crime_heads = [
            CrimeHead(crime_head_id=1, crime_group_name="Theft", active=True),
            CrimeHead(crime_head_id=2, crime_group_name="Robbery", active=True),
            CrimeHead(crime_head_id=3, crime_group_name="Murder", active=True),
            CrimeHead(crime_head_id=4, crime_group_name="Fraud", active=True),
            CrimeHead(crime_head_id=5, crime_group_name="Cyber Crime", active=True),
            CrimeHead(crime_head_id=6, crime_group_name="Assault", active=True)
        ]
        db.add_all(crime_heads)
        db.commit()

        # 11. Seed Crime Sub Heads
        crime_sub_heads = [
            CrimeSubHead(crime_sub_head_id=1, crime_head_id=1, crime_head_name="Bike Theft", seq_id=1),
            CrimeSubHead(crime_sub_head_id=2, crime_head_id=2, crime_head_name="House Dacoity", seq_id=1),
            CrimeSubHead(crime_sub_head_id=3, crime_head_id=3, crime_head_name="Homicide", seq_id=1),
            CrimeSubHead(crime_sub_head_id=4, crime_head_id=4, crime_head_name="Credit Card Fraud", seq_id=1),
            CrimeSubHead(crime_sub_head_id=5, crime_head_id=5, crime_head_name="Ransomware", seq_id=1),
            CrimeSubHead(crime_sub_head_id=6, crime_head_id=6, crime_head_name="Physical Assault", seq_id=1)
        ]
        db.add_all(crime_sub_heads)
        db.commit()

        # 12. Seed Legal Acts and Sections
        acts = [
            Act(act_code="IPC", act_description="Indian Penal Code", short_name="IPC", active=True),
            Act(act_code="BNS", act_description="Bharatiya Nyaya Sanhita", short_name="BNS", active=True)
        ]
        db.add_all(acts)
        db.commit()

        sections = [
            Section(act_code="IPC", section_code="379", section_description="Punishment for theft", active=True),
            Section(act_code="IPC", section_code="392", section_description="Punishment for robbery", active=True),
            Section(act_code="IPC", section_code="302", section_description="Punishment for murder", active=True),
            Section(act_code="IPC", section_code="420", section_description="Cheating and dishonestly inducing delivery of property", active=True),
            Section(act_code="IPC", section_code="323", section_description="Punishment for voluntarily causing hurt", active=True)
        ]
        db.add_all(sections)
        db.commit()

        # 13. Seed Crime Head to Act-Section mappings
        mappings = [
            CrimeHeadActSection(crime_head_id=1, act_code="IPC", section_code="379"),
            CrimeHeadActSection(crime_head_id=2, act_code="IPC", section_code="392"),
            CrimeHeadActSection(crime_head_id=3, act_code="IPC", section_code="302"),
            CrimeHeadActSection(crime_head_id=4, act_code="IPC", section_code="420"),
            CrimeHeadActSection(crime_head_id=6, act_code="IPC", section_code="323")
        ]
        db.add_all(mappings)
        db.commit()

        # 14. Seed People Identities
        people = [
            # Criminals / Suspects
            PersonIdentity(full_name="Arun Kumar", gender="Male", dob=datetime.date(1999, 5, 20), age=27, mobile="9876500001", email="arun@gmail.com", aadhaar="123412341234", pan="ABCDE1234F", passport="P1234567", address="KR Puram, Bengaluru", occupation="Driver", education="PUC", photo_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop", risk_score=85),
            PersonIdentity(full_name="Suresh Gowda", gender="Male", dob=datetime.date(1995, 1, 10), age=31, mobile="9876500002", email="suresh@gmail.com", aadhaar="222233334444", pan="PQRSX9876Y", passport="P9876543", address="Indiranagar, Bengaluru", occupation="Mechanic", education="Diploma", photo_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop", risk_score=72),
            PersonIdentity(full_name="Ramesh Hegde", gender="Male", dob=datetime.date(1988, 8, 15), age=37, mobile="9876500003", email="ramesh@gmail.com", aadhaar="555566667777", pan="RSTUV5678Z", passport="P5555555", address="Mysuru Central", occupation="Contractor", education="BCom", photo_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop", risk_score=90),
            
            # Victims / Complainants
            PersonIdentity(full_name="Anjali Rao", gender="Female", dob=datetime.date(1992, 3, 12), age=34, mobile="9988776655", email="anjali@gmail.com", aadhaar="999988887777", pan="ANJAL1234P", passport="P9999999", address="Whitefield, Bengaluru", occupation="IT Manager", education="BE", photo_url="", risk_score=10),
            PersonIdentity(full_name="Rajesh Naik", gender="Male", dob=datetime.date(1975, 11, 4), age=50, mobile="9900881122", email="rajeshn@gmail.com", aadhaar="111122223333", pan="RAJES9876Q", passport="", address="Hubballi North", occupation="Shopkeeper", education="SSLC", photo_url="", risk_score=5),
            PersonIdentity(full_name="Priya Sharma", gender="Female", dob=datetime.date(2001, 7, 22), age=25, mobile="9880112233", email="priya@gmail.com", aadhaar="444455556666", pan="", passport="", address="Malleshwaram, Bengaluru", occupation="Student", education="BSc", photo_url="", risk_score=15)
        ]
        db.add_all(people)
        db.commit()

        # Refresh to get person identities
        p_arun = db.query(PersonIdentity).filter_by(full_name="Arun Kumar").first()
        p_suresh = db.query(PersonIdentity).filter_by(full_name="Suresh Gowda").first()
        p_ramesh = db.query(PersonIdentity).filter_by(full_name="Ramesh Hegde").first()
        p_anjali = db.query(PersonIdentity).filter_by(full_name="Anjali Rao").first()
        p_rajesh = db.query(PersonIdentity).filter_by(full_name="Rajesh Naik").first()
        p_priya = db.query(PersonIdentity).filter_by(full_name="Priya Sharma").first()

        # 15. Seed Cases (CaseMaster) with KSP details
        cases = [
            Case(
                fir_number="FIR-2026-001", crime_type="Theft", district="Bengaluru", police_station="Koramangala PS", 
                case_status="Pending", crime_date=datetime.date(2026, 1, 15),
                police_person_id=1, police_station_id=1, case_category_id=1, gravity_offence_id=2,
                crime_major_head_id=1, crime_minor_head_id=1, case_status_id=1, court_id=1,
                incident_from_date=datetime.datetime(2026, 1, 14, 22, 0, 0),
                incident_to_date=datetime.datetime(2026, 1, 14, 23, 30, 0),
                info_received_ps_date=datetime.datetime(2026, 1, 15, 8, 30, 0),
                latitude=12.9345, longitude=77.6101, brief_facts="A Black Bajaj Pulsar 220 bike was stolen."
            ),
            Case(
                fir_number="FIR-2026-002", crime_type="Robbery", district="Mysuru", police_station="Mysuru Central PS", 
                case_status="Under Investigation", crime_date=datetime.date(2026, 2, 20),
                police_person_id=3, police_station_id=3, case_category_id=1, gravity_offence_id=1,
                crime_major_head_id=2, crime_minor_head_id=2, case_status_id=2, court_id=2,
                incident_from_date=datetime.datetime(2026, 2, 19, 21, 15, 0),
                incident_to_date=datetime.datetime(2026, 2, 19, 21, 45, 0),
                info_received_ps_date=datetime.datetime(2026, 2, 20, 10, 0, 0),
                latitude=12.3086, longitude=76.6456, brief_facts="Victim was mugged at knife-point near Mysore Central."
            ),
            Case(
                fir_number="FIR-2026-003", crime_type="Murder", district="Bengaluru", police_station="Whitefield PS", 
                case_status="Solved", crime_date=datetime.date(2026, 3, 10),
                police_person_id=2, police_station_id=2, case_category_id=1, gravity_offence_id=1,
                crime_major_head_id=3, crime_minor_head_id=3, case_status_id=3, court_id=1,
                incident_from_date=datetime.datetime(2026, 3, 9, 23, 0, 0),
                incident_to_date=datetime.datetime(2026, 3, 10, 2, 0, 0),
                info_received_ps_date=datetime.datetime(2026, 3, 10, 6, 0, 0),
                latitude=12.9698, longitude=77.7500, brief_facts="Body of a young female found inside a PG hostel room."
            ),
            Case(
                fir_number="FIR-2026-004", crime_type="Fraud", district="Bengaluru", police_station="Koramangala PS", 
                case_status="Pending", crime_date=datetime.date(2026, 4, 5),
                police_person_id=1, police_station_id=1, case_category_id=1, gravity_offence_id=2,
                crime_major_head_id=4, crime_minor_head_id=4, case_status_id=1, court_id=1,
                incident_from_date=datetime.datetime(2026, 4, 1, 10, 0, 0),
                incident_to_date=datetime.datetime(2026, 4, 4, 18, 0, 0),
                info_received_ps_date=datetime.datetime(2026, 4, 5, 11, 30, 0),
                latitude=12.9340, longitude=77.6110, brief_facts="Complainant duped of 2 Lakhs via online card fraud."
            ),
            Case(
                fir_number="FIR-2026-005", crime_type="Cyber Crime", district="Bengaluru", police_station="Whitefield PS", 
                case_status="Under Investigation", crime_date=datetime.date(2026, 5, 12),
                police_person_id=2, police_station_id=2, case_category_id=1, gravity_offence_id=2,
                crime_major_head_id=5, crime_minor_head_id=5, case_status_id=2, court_id=1,
                incident_from_date=datetime.datetime(2026, 5, 10, 9, 0, 0),
                incident_to_date=datetime.datetime(2026, 5, 11, 17, 0, 0),
                info_received_ps_date=datetime.datetime(2026, 5, 12, 14, 0, 0),
                latitude=12.9705, longitude=77.7510, brief_facts="IT company server hacked and files encrypted."
            ),
            Case(
                fir_number="FIR-2026-006", crime_type="Theft", district="Hubballi", police_station="Hubballi City PS", 
                case_status="Closed", crime_date=datetime.date(2026, 5, 25),
                police_person_id=4, police_station_id=4, case_category_id=1, gravity_offence_id=2,
                crime_major_head_id=1, crime_minor_head_id=1, case_status_id=4, court_id=3,
                incident_from_date=datetime.datetime(2026, 5, 24, 13, 0, 0),
                incident_to_date=datetime.datetime(2026, 5, 24, 15, 0, 0),
                info_received_ps_date=datetime.datetime(2026, 5, 25, 9, 0, 0),
                latitude=15.3647, longitude=75.1240, brief_facts="Looting of cash box in a local department store."
            ),
            Case(
                fir_number="FIR-2026-007", crime_type="Assault", district="Mangaluru", police_station="Mangaluru North PS", 
                case_status="Pending", crime_date=datetime.date(2026, 6, 1),
                police_person_id=1, police_station_id=5, case_category_id=1, gravity_offence_id=2,
                crime_major_head_id=6, crime_minor_head_id=6, case_status_id=1, court_id=2,
                incident_from_date=datetime.datetime(2026, 5, 31, 20, 0, 0),
                incident_to_date=datetime.datetime(2026, 5, 31, 21, 0, 0),
                info_received_ps_date=datetime.datetime(2026, 6, 1, 10, 0, 0),
                latitude=12.9141, longitude=74.8560, brief_facts="Altercation outside pub leading to physical injuries."
            ),
            Case(
                fir_number="FIR-2026-008", crime_type="Theft", district="Mysuru", police_station="Mysuru Central PS", 
                case_status="Under Investigation", crime_date=datetime.date(2026, 6, 18),
                police_person_id=3, police_station_id=3, case_category_id=1, gravity_offence_id=2,
                crime_major_head_id=1, crime_minor_head_id=1, case_status_id=2, court_id=2,
                incident_from_date=datetime.datetime(2026, 6, 17, 2, 0, 0),
                incident_to_date=datetime.datetime(2026, 6, 17, 4, 0, 0),
                info_received_ps_date=datetime.datetime(2026, 6, 18, 11, 0, 0),
                latitude=12.3080, longitude=76.6450, brief_facts="Laptop stolen from locked shop in Mysuru market."
            )
        ]
        db.add_all(cases)
        db.commit()

        # Refresh cases to get generated IDs
        c1 = db.query(Case).filter_by(fir_number="FIR-2026-001").first()
        c2 = db.query(Case).filter_by(fir_number="FIR-2026-002").first()
        c3 = db.query(Case).filter_by(fir_number="FIR-2026-003").first()
        c4 = db.query(Case).filter_by(fir_number="FIR-2026-004").first()
        c5 = db.query(Case).filter_by(fir_number="FIR-2026-005").first()
        c6 = db.query(Case).filter_by(fir_number="FIR-2026-006").first()
        c7 = db.query(Case).filter_by(fir_number="FIR-2026-007").first()
        c8 = db.query(Case).filter_by(fir_number="FIR-2026-008").first()

        # 16. Seed Accused
        accused_list = [
            Accused(case_id=c1.case_id, name="Arun Kumar", gender="Male", age=27, address="KR Puram, Bengaluru", person_id="A1"),
            Accused(case_id=c2.case_id, name="Suresh Gowda", gender="Male", age=31, address="Indiranagar, Bengaluru", person_id="A1"),
            Accused(case_id=c3.case_id, name="Ramesh Hegde", gender="Male", age=37, address="Mysuru Central", person_id="A1"),
            Accused(case_id=c4.case_id, name="Arun Kumar", gender="Male", age=27, address="KR Puram, Bengaluru", person_id="A1"),
            Accused(case_id=c5.case_id, name="Suresh Gowda", gender="Male", age=31, address="Indiranagar, Bengaluru", person_id="A1"),
            Accused(case_id=c8.case_id, name="Arun Kumar", gender="Male", age=27, address="KR Puram, Bengaluru", person_id="A1")
        ]
        db.add_all(accused_list)
        db.commit()

        # 17. Seed Victims
        victims = [
            Victim(case_id=c1.case_id, name="Anjali Rao", gender="Female", age=34, address="Whitefield, Bengaluru", victim_police="0"),
            Victim(case_id=c2.case_id, name="Rajesh Naik", gender="Male", age=50, address="Hubballi North", victim_police="0"),
            Victim(case_id=c3.case_id, name="Priya Sharma", gender="Female", age=25, address="Malleshwaram, Bengaluru", victim_police="0"),
            Victim(case_id=c4.case_id, name="Anjali Rao", gender="Female", age=34, address="Whitefield, Bengaluru", victim_police="0")
        ]
        db.add_all(victims)
        db.commit()

        # 18. Seed Complainants
        complainants = [
            Complainant(case_id=c1.case_id, name="Anjali Rao", gender="Female", age=34, mobile="9988776655", address="Whitefield, Bengaluru", occupation_id=4, religion_id=1, caste_id=1),
            Complainant(case_id=c2.case_id, name="Rajesh Naik", gender="Male", age=50, mobile="9900881122", address="Hubballi North", occupation_id=5, religion_id=1, caste_id=1),
            Complainant(case_id=c3.case_id, name="Kiran Kumar", gender="Male", age=29, mobile="9980808080", address="Koramangala, Bengaluru", occupation_id=3, religion_id=1, caste_id=1),
            Complainant(case_id=c4.case_id, name="Anjali Rao", gender="Female", age=34, mobile="9988776655", address="Whitefield, Bengaluru", occupation_id=4, religion_id=1, caste_id=1)
        ]
        db.add_all(complainants)
        db.commit()

        # 19. Seed Criminal History
        histories = [
            CriminalHistory(person_id=p_arun.person_id, case_id=c1.case_id, crime_type="Theft", arrest_date=datetime.date(2026, 1, 16), conviction="Pending", status="Pending"),
            CriminalHistory(person_id=p_arun.person_id, case_id=c4.case_id, crime_type="Fraud", arrest_date=datetime.date(2026, 4, 10), conviction="Pending", status="Pending"),
            CriminalHistory(person_id=p_arun.person_id, case_id=c8.case_id, crime_type="Theft", arrest_date=datetime.date(2026, 6, 20), conviction="Pending", status="Under Investigation"),
            
            CriminalHistory(person_id=p_suresh.person_id, case_id=c2.case_id, crime_type="Robbery", arrest_date=datetime.date(2026, 2, 22), conviction="Pending", status="Under Investigation"),
            CriminalHistory(person_id=p_suresh.person_id, case_id=c5.case_id, crime_type="Cyber Crime", arrest_date=datetime.date(2026, 5, 15), conviction="Pending", status="Under Investigation")
        ]
        db.add_all(histories)

        # 20. Seed Evidence
        evidences = [
            Evidence(case_id=c1.case_id, evidence_type="CCTV Footage", description="CCTV showing accused breaking into house", file_url="/evidence/cctv_c1.mp4"),
            Evidence(case_id=c1.case_id, evidence_type="Fingerprint", description="Fingerprint match on door handle", file_url="/evidence/fp_c1.png"),
            Evidence(case_id=c2.case_id, evidence_type="Weapon", description="Recovered knife used in robbery", file_url="/evidence/weapon_c2.jpg"),
            Evidence(case_id=c3.case_id, evidence_type="Autopsy Report", description="Autopsy details asphyxiation", file_url="/evidence/autopsy_c3.pdf"),
            Evidence(case_id=c5.case_id, evidence_type="IP Logs", description="ISP log showing trace to suspect address", file_url="/evidence/iplog_c5.txt")
        ]
        db.add_all(evidences)

        # 21. Seed Vehicles
        vehicles = [
            Vehicle(person_id=p_arun.person_id, registration_number="KA01AB1234", vehicle_type="Motorcycle", model="Pulsar 220", color="Black", manufacturer="Bajaj"),
            Vehicle(person_id=p_suresh.person_id, registration_number="KA03MX9876", vehicle_type="Sedan", model="City", color="White", manufacturer="Honda"),
            Vehicle(person_id=p_ramesh.person_id, registration_number="KA55ZZ5555", vehicle_type="SUV", model="Thar", color="Red", manufacturer="Mahindra")
        ]
        db.add_all(vehicles)

        # 22. Seed Phones
        phones = [
            Phone(person_id=p_arun.person_id, mobile="9876500001", imei="356789012345678", sim_number="899110120000001111", provider="Jio"),
            Phone(person_id=p_suresh.person_id, mobile="9876500002", imei="359999012345678", sim_number="899110120000002222", provider="Airtel"),
            Phone(person_id=p_ramesh.person_id, mobile="9876500003", imei="354444012345678", sim_number="899110120000003333", provider="Vodafone")
        ]
        db.add_all(phones)

        # 23. Seed Financial Accounts
        financials = [
            FinancialAccount(person_id=p_arun.person_id, bank_name="State Bank of India", account_number="1000234567", ifsc="SBIN0001234", upi="arun@oksbi", wallet="SBI Pay"),
            FinancialAccount(person_id=p_suresh.person_id, bank_name="HDFC Bank", account_number="50100234567", ifsc="HDFC0000002", upi="suresh@okhdfc", wallet="Paytm"),
            FinancialAccount(person_id=p_ramesh.person_id, bank_name="ICICI Bank", account_number="00020100456", ifsc="ICIC0000002", upi="ramesh@okicici", wallet="PhonePe")
        ]
        db.add_all(financials)

        # 24. Seed Known Associates
        associates = [
            KnownAssociate(person_id=p_arun.person_id, associate_person_id=p_suresh.person_id, relationship_type="Accomplice", confidence=95),
            KnownAssociate(person_id=p_suresh.person_id, associate_person_id=p_ramesh.person_id, relationship_type="Business Partner", confidence=70)
        ]
        db.add_all(associates)

        # 25. Seed ActSectionAssociation
        act_sections = [
            ActSectionAssociation(case_master_id=c1.case_id, act_id="IPC", section_id="379", act_order_id=1, section_order_id=1),
            ActSectionAssociation(case_master_id=c2.case_id, act_id="IPC", section_id="392", act_order_id=1, section_order_id=1),
            ActSectionAssociation(case_master_id=c3.case_id, act_id="IPC", section_id="302", act_order_id=1, section_order_id=1),
            ActSectionAssociation(case_master_id=c4.case_id, act_id="IPC", section_id="420", act_order_id=1, section_order_id=1),
            ActSectionAssociation(case_master_id=c7.case_id, act_id="IPC", section_id="323", act_order_id=1, section_order_id=1)
        ]
        db.add_all(act_sections)

        # 26. Seed ChargesheetDetails
        chargesheets = [
            ChargesheetDetails(case_master_id=c3.case_id, cs_date=datetime.datetime(2026, 3, 25, 14, 30, 0), cs_type="A", police_person_id=2)
        ]
        db.add_all(chargesheets)

        # 27. Seed ArrestSurrender
        acc_arun = db.query(Accused).filter_by(case_id=c1.case_id, name="Arun Kumar").first()
        acc_suresh = db.query(Accused).filter_by(case_id=c2.case_id, name="Suresh Gowda").first()
        acc_ramesh = db.query(Accused).filter_by(case_id=c3.case_id, name="Ramesh Hegde").first()

        arrests = [
            ArrestSurrender(case_master_id=c1.case_id, arrest_surrender_type_id=1, arrest_surrender_date=datetime.date(2026, 1, 16), arrest_surrender_state_id=1, arrest_surrender_district_id=1, police_station_id=1, io_id=1, court_id=1, accused_master_id=acc_arun.accused_id, is_accused=True),
            ArrestSurrender(case_master_id=c2.case_id, arrest_surrender_type_id=1, arrest_surrender_date=datetime.date(2026, 2, 22), arrest_surrender_state_id=1, arrest_surrender_district_id=1, police_station_id=3, io_id=3, court_id=2, accused_master_id=acc_suresh.accused_id, is_accused=True),
            ArrestSurrender(case_master_id=c3.case_id, arrest_surrender_type_id=1, arrest_surrender_date=datetime.date(2026, 3, 12), arrest_surrender_state_id=1, arrest_surrender_district_id=1, police_station_id=2, io_id=2, court_id=1, accused_master_id=acc_ramesh.accused_id, is_accused=True)
        ]
        db.add_all(arrests)

        db.commit()
        print("Database seeded with KSP and custom analytics data successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
