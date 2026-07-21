"""
Officers repository — data access layer for Officer model.
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.auth.models import Officer


class OfficerRepository:

    def __init__(self, db: Session):
        self.db = db

    def list_officers(
        self,
        skip: int = 0,
        limit: int = 50,
        role: Optional[str] = None,
        district_id: Optional[int] = None,
        unit_id: Optional[int] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[list[Officer], int]:
        q = self.db.query(Officer)

        if role:
            q = q.filter(Officer.role == role)
        if district_id:
            q = q.filter(Officer.district_id == district_id)
        if unit_id:
            q = q.filter(Officer.unit_id == unit_id)
        if is_active is not None:
            q = q.filter(Officer.is_active == is_active)
        if search:
            like = f"%{search}%"
            q = q.filter(
                Officer.full_name.ilike(like)
                | Officer.badge_number.ilike(like)
                | Officer.email.ilike(like)
            )

        total = q.count()
        officers = q.order_by(Officer.full_name).offset(skip).limit(limit).all()
        return officers, total

    def get_by_id(self, officer_id: int) -> Optional[Officer]:
        return self.db.query(Officer).filter(Officer.id == officer_id).first()

    def update(self, officer: Officer, data: dict) -> Officer:
        for key, val in data.items():
            if val is not None and hasattr(officer, key):
                setattr(officer, key, val)
        self.db.commit()
        self.db.refresh(officer)
        return officer

    def deactivate(self, officer: Officer) -> Officer:
        officer.is_active = False
        self.db.commit()
        return officer

    def get_stats(self) -> dict:
        from sqlalchemy import func

        total = self.db.query(func.count(Officer.id)).scalar()
        active = self.db.query(func.count(Officer.id)).filter(Officer.is_active == True).scalar()

        role_counts = (
            self.db.query(Officer.role, func.count(Officer.id))
            .group_by(Officer.role)
            .all()
        )

        return {
            "total_officers": total,
            "active_officers": active,
            "by_role": {r: c for r, c in role_counts},
        }
