"""
Cases repository — data access layer with jurisdiction (row-level security) support.
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.models.case import Case


class CaseRepository:

    def __init__(self, db: Session):
        self.db = db

    def _apply_jurisdiction(self, q, jurisdiction: dict):
        """Apply row-level security filters based on officer jurisdiction."""
        if not jurisdiction:
            return q
        if "district_id" in jurisdiction:
            from app.models.district import District
            district = self.db.query(District).filter(
                District.district_id == jurisdiction["district_id"]
            ).first()
            if district:
                q = q.filter(Case.district.ilike(f"%{district.district_name}%"))
        if "police_station_id" in jurisdiction:
            q = q.filter(Case.police_station_id == jurisdiction["police_station_id"])
        return q

    def list_cases(
        self,
        skip: int = 0,
        limit: int = 50,
        crime_type: Optional[str] = None,
        case_status: Optional[str] = None,
        district: Optional[str] = None,
        search: Optional[str] = None,
        jurisdiction: dict = None,
    ) -> tuple[list[Case], int]:
        q = self.db.query(Case)

        if jurisdiction:
            q = self._apply_jurisdiction(q, jurisdiction)

        if crime_type:
            q = q.filter(Case.crime_type.ilike(f"%{crime_type}%"))
        if case_status:
            q = q.filter(Case.case_status.ilike(f"%{case_status}%"))
        if district:
            q = q.filter(Case.district.ilike(f"%{district}%"))
        if search:
            like = f"%{search}%"
            q = q.filter(
                Case.fir_number.ilike(like)
                | Case.crime_type.ilike(like)
                | Case.district.ilike(like)
                | Case.police_station.ilike(like)
                | Case.brief_facts.ilike(like)
            )

        total = q.count()
        cases = (
            q.order_by(Case.crime_date.desc().nullslast())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return cases, total

    def get_by_id(self, case_id: int, jurisdiction: dict = None) -> Optional[Case]:
        q = self.db.query(Case).filter(Case.case_id == case_id)
        if jurisdiction:
            q = self._apply_jurisdiction(q, jurisdiction)
        return q.first()

    def create(self, data: dict) -> Case:
        case = Case(**data)
        self.db.add(case)
        self.db.commit()
        self.db.refresh(case)
        return case

    def update(self, case: Case, data: dict) -> Case:
        for key, val in data.items():
            if val is not None and hasattr(case, key):
                setattr(case, key, val)
        if "case_description" in data and data["case_description"]:
            case.brief_facts = data["case_description"]

        # Complainant fields
        comp_name = data.get("complainant_name")
        comp_mobile = data.get("complainant_mobile")
        comp_aadhaar = data.get("complainant_aadhaar")
        comp_address = data.get("complainant_address")
        comp_gender = data.get("complainant_gender")
        comp_age = data.get("complainant_age")

        if comp_name or comp_mobile or comp_aadhaar or comp_address or comp_gender or comp_age is not None:
            from app.models.complainant import Complainant
            from app.models.person_identity import PersonIdentity

            comp = self.db.query(Complainant).filter(Complainant.case_id == case.case_id).first()
            if not comp:
                comp = Complainant(case_id=case.case_id)
                self.db.add(comp)
            if comp_name: comp.name = comp_name
            if comp_mobile: comp.mobile = comp_mobile
            if comp_address: comp.address = comp_address
            if comp_gender: comp.gender = comp_gender
            if comp_age is not None:
                try: comp.age = int(comp_age)
                except: pass

            target_name = comp_name or comp.name
            if target_name:
                person = self.db.query(PersonIdentity).filter(PersonIdentity.full_name == target_name).first()
                if not person:
                    person = PersonIdentity(full_name=target_name)
                    self.db.add(person)
                if comp_mobile: person.mobile = comp_mobile
                if comp_aadhaar: person.aadhaar = comp_aadhaar
                if comp_address: person.address = comp_address
                if comp_gender: person.gender = comp_gender
                if comp_age is not None:
                    try: person.age = int(comp_age)
                    except: pass

        # Accused fields
        acc_name = data.get("accused_name")
        acc_mobile = data.get("accused_mobile")
        acc_aadhaar = data.get("accused_aadhaar")
        acc_address = data.get("accused_address")
        acc_gender = data.get("accused_gender")
        acc_age = data.get("accused_age")

        if acc_name or acc_mobile or acc_aadhaar or acc_address or acc_gender or acc_age is not None:
            from app.models.accused import Accused
            from app.models.person_identity import PersonIdentity

            acc = self.db.query(Accused).filter(Accused.case_id == case.case_id).first()
            if not acc:
                acc = Accused(case_id=case.case_id)
                self.db.add(acc)
            if acc_name: acc.name = acc_name
            if acc_address: acc.address = acc_address
            if acc_gender: acc.gender = acc_gender
            if acc_age is not None:
                try: acc.age = int(acc_age)
                except: pass

            target_name = acc_name or acc.name
            if target_name:
                person = self.db.query(PersonIdentity).filter(PersonIdentity.full_name == target_name).first()
                if not person:
                    person = PersonIdentity(full_name=target_name)
                    self.db.add(person)
                if acc_mobile: person.mobile = acc_mobile
                if acc_aadhaar: person.aadhaar = acc_aadhaar
                if acc_address: person.address = acc_address
                if acc_gender: person.gender = acc_gender
                if acc_age is not None:
                    try: person.age = int(acc_age)
                    except: pass

        self.db.commit()
        self.db.refresh(case)
        return case

    def delete(self, case: Case) -> None:
        self.db.delete(case)
        self.db.commit()
