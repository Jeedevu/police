from sqlalchemy import func
from app.models.case import Case
from app.analytics.repeat_offenders import repeat_offenders
from app.analytics.crime_trends import crime_trends
from app.analytics.criminal_network import criminal_network


def get_repeat_offenders(db):
    return repeat_offenders(db)


def get_crime_trends(db):
    return crime_trends(db)


def get_criminal_network(db):
    return criminal_network(db)


def get_district_crimes(db):
    results = (
        db.query(
            Case.district,
            func.count(Case.case_id).label("total_cases")
        )
        .group_by(Case.district)
        .order_by(func.count(Case.case_id).desc())
        .all()
    )
    return [
        {
            "district": row.district or "Unknown",
            "total_cases": row.total_cases
        }
        for row in results
    ]


def get_monthly_crimes(db):
    # Using extract for SQLite / Postgres compatibility, but since we use Postgres:
    # We can group by date_trunc or extract year/month.
    results = (
        db.query(
            func.extract('year', Case.crime_date).label('year'),
            func.extract('month', Case.crime_date).label('month'),
            func.count(Case.case_id).label("total_cases")
        )
        .filter(Case.crime_date.isnot(None))
        .group_by(
            func.extract('year', Case.crime_date),
            func.extract('month', Case.crime_date)
        )
        .order_by(
            func.extract('year', Case.crime_date),
            func.extract('month', Case.crime_date)
        )
        .all()
    )
    
    months_map = {
        1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
        7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
    }
    
    return [
        {
            "month": f"{months_map.get(int(row.month), str(int(row.month)))} {int(row.year)}",
            "total_cases": row.total_cases
        }
        for row in results
    ]