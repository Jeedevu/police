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
        self.db.commit()
        self.db.refresh(case)
        return case

    def delete(self, case: Case) -> None:
        self.db.delete(case)
        self.db.commit()
