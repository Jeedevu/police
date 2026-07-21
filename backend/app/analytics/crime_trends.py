from sqlalchemy import func
from app.models.case import Case


def crime_trends(db):

    results = (
        db.query(
            Case.crime_type,
            func.count(Case.case_id).label("total_cases")
        )
        .group_by(Case.crime_type)
        .order_by(func.count(Case.case_id).desc())
        .all()
    )

    return [
        {
            "crime_type": row.crime_type,
            "total_cases": row.total_cases
        }
        for row in results
    ]