from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.connection import get_db
from app.services.analytics_service import (
    get_criminal_network,
    get_repeat_offenders,
    get_crime_trends,
    get_district_crimes,
    get_monthly_crimes,
)
from app.analytics.advanced_analytics import (
    officer_workload,
    get_case_status_breakdown,
    get_high_risk_alerts,
    get_predictions,
)

router = APIRouter(
    prefix="",
    tags=["Analytics"]
)


@router.get("/repeat-offenders")
def repeat(db: Session = Depends(get_db)):
    return get_repeat_offenders(db)


@router.get("/crime-trends")
def trends(db: Session = Depends(get_db)):
    return get_crime_trends(db)


@router.get("/criminal-network")
def network(db: Session = Depends(get_db)):
    return get_criminal_network(db)


@router.get("/districts")
def districts(db: Session = Depends(get_db)):
    return get_district_crimes(db)


@router.get("/monthly")
def monthly(db: Session = Depends(get_db)):
    return get_monthly_crimes(db)


@router.get("/officer-workload")
def workload(db: Session = Depends(get_db)):
    return officer_workload(db)


@router.get("/case-status")
def case_status(db: Session = Depends(get_db)):
    return get_case_status_breakdown(db)


@router.get("/alerts")
def alerts(db: Session = Depends(get_db)):
    return get_high_risk_alerts(db)


@router.get("/predictions")
def predictions(db: Session = Depends(get_db)):
    return get_predictions(db)


# ── Crime Heat Map Module Endpoints ──────────────────────────────────────────

def build_heatmap_where_clause(
    crime_type: Optional[str] = None,
    station: Optional[str] = None,
    officer: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    city: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    search: Optional[str] = None,
):
    clauses = ["latitude IS NOT NULL", "longitude IS NOT NULL"]
    params = {}

    if crime_type and crime_type.lower() != "all":
        clauses.append("crime_type ILIKE :crime_type")
        params["crime_type"] = f"%{crime_type}%"

    if station and station.lower() != "all":
        clauses.append("police_station ILIKE :station")
        params["station"] = f"%{station}%"

    if status and status.lower() != "all":
        clauses.append("case_status ILIKE :status")
        params["status"] = f"%{status}%"

    if city and city.lower() != "all":
        clauses.append("(district ILIKE :city OR police_station ILIKE :city OR brief_facts ILIKE :city)")
        params["city"] = f"%{city}%"

    if officer and officer.lower() != "all":
        clauses.append("brief_facts ILIKE :officer")
        params["officer"] = f"%{officer}%"

    if from_date:
        clauses.append("crime_date >= :from_date")
        params["from_date"] = from_date

    if to_date:
        clauses.append("crime_date <= :to_date")
        params["to_date"] = to_date

    if search:
        clauses.append("(fir_number ILIKE :search OR crime_type ILIKE :search OR district ILIKE :search OR police_station ILIKE :search OR brief_facts ILIKE :search)")
        params["search"] = f"%{search}%"

    where = " WHERE " + " AND ".join(clauses)
    return where, params


@router.get("/heatmap")
def get_heatmap(
    crime_type: Optional[str] = None,
    station: Optional[str] = None,
    officer: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    city: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Return list of GPS points for Crime Heat Map:
    [ { "lat": 12.9716, "lng": 77.5946, "weight": 18, "crime_type": "Theft", "station": "Cubbon Park PS" } ]
    """
    where_sql, params = build_heatmap_where_clause(
        crime_type, station, officer, status, risk_level, city, from_date, to_date, search
    )

    query = f"""
        SELECT 
            case_id,
            fir_number,
            crime_type,
            police_station AS station,
            district,
            case_status AS status,
            crime_date,
            CAST(latitude AS float) AS lat,
            CAST(longitude AS float) AS lng,
            brief_facts
        FROM casemaster
        {where_sql}
        ORDER BY case_id DESC
        LIMIT 1000
    """

    with db.bind.connect() as conn:
        rows = conn.execute(text(query), params).mappings().all()

    points = []
    for r in rows:
        c_type = (r["crime_type"] or "").lower()
        # Severity weighting
        if "murder" in c_type or "robbery" in c_type or "assault" in c_type or "drug" in c_type:
            weight = random_weight = 22
        elif "cyber" in c_type or "fraud" in c_type or "kidnap" in c_type:
            weight = 16
        else:
            weight = 12

        points.append({
            "lat": r["lat"],
            "lng": r["lng"],
            "weight": weight,
            "crime_type": r["crime_type"],
            "station": r["station"] or r["district"] or "KSP Station",
            "case_id": r["case_id"],
            "fir_number": r["fir_number"],
            "status": r["status"] or "Open",
            "district": r["district"],
            "crime_date": str(r["crime_date"]) if r["crime_date"] else None,
            "brief_facts": r["brief_facts"]
        })

    return points


@router.get("/heatmap/summary")
def get_heatmap_summary(
    crime_type: Optional[str] = None,
    station: Optional[str] = None,
    officer: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    city: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Return Summary Metrics for Heat Map:
    { "total_cases": 300, "hotspots": 18, "highest_city": "Bengaluru", "highest_crime": "Theft" }
    """
    where_sql, params = build_heatmap_where_clause(
        crime_type, station, officer, status, risk_level, city, from_date, to_date, search
    )

    with db.bind.connect() as conn:
        # Total cases
        total_res = conn.execute(text(f"SELECT COUNT(*) FROM casemaster {where_sql}"), params).scalar() or 0

        # Unique stations / hotspots
        hotspot_res = conn.execute(text(f"SELECT COUNT(DISTINCT police_station) FROM casemaster {where_sql}"), params).scalar() or 0

        # Today's / recent cases
        today_sql = where_sql + " AND crime_date >= CURRENT_DATE - INTERVAL '7 days'"
        todays_cases = conn.execute(text(f"SELECT COUNT(*) FROM casemaster {today_sql}"), params).scalar() or 0

        # High risk / violent cases
        high_risk_sql = where_sql + " AND (crime_type ILIKE '%murder%' OR crime_type ILIKE '%robbery%' OR crime_type ILIKE '%assault%' OR crime_type ILIKE '%cyber%')"
        high_risk_cases = conn.execute(text(f"SELECT COUNT(*) FROM casemaster {high_risk_sql}"), params).scalar() or 0

        # Active investigations
        active_sql = where_sql + " AND (case_status ILIKE '%open%' OR case_status ILIKE '%investigation%' OR case_status IS NULL)"
        active_cases = conn.execute(text(f"SELECT COUNT(*) FROM casemaster {active_sql}"), params).scalar() or 0

        # Highest city
        city_res = conn.execute(text(f"SELECT district, COUNT(*) as c FROM casemaster {where_sql} GROUP BY district ORDER BY c DESC LIMIT 1"), params).mappings().first()
        highest_city = city_res["district"].replace(" District", "") if city_res and city_res["district"] else "Bengaluru"

        # Highest crime type
        crime_res = conn.execute(text(f"SELECT crime_type, COUNT(*) as c FROM casemaster {where_sql} GROUP BY crime_type ORDER BY c DESC LIMIT 1"), params).mappings().first()
        highest_crime = crime_res["crime_type"] if crime_res else "Theft"

    return {
        "total_cases": total_res,
        "hotspots": max(hotspot_res, 1),
        "highest_city": highest_city,
        "highest_crime": highest_crime,
        "todays_cases": todays_cases,
        "high_risk_cases": high_risk_cases,
        "active_investigations": active_cases
    }


@router.get("/hotspot/{location:path}")
def get_hotspot_details(location: str, db: Session = Depends(get_db)):
    """
    Return detailed intelligence breakdown when clicking a hotspot/station on the map:
    { "location": "Majestic", "cases": 32, "station": "Upparpet", "topCrime": "Theft", "averageRisk": 81, "recentCases": [] }
    """
    loc_param = f"%{location}%"
    with db.bind.connect() as conn:
        cases_rows = conn.execute(text("""
            SELECT case_id, fir_number, crime_type, district, police_station, case_status, crime_date, brief_facts
            FROM casemaster
            WHERE police_station ILIKE :l OR district ILIKE :l OR brief_facts ILIKE :l
            ORDER BY crime_date DESC NULLS LAST
            LIMIT 10
        """), {"l": loc_param}).mappings().all()

        total_cases_count = conn.execute(text("""
            SELECT COUNT(*) FROM casemaster
            WHERE police_station ILIKE :l OR district ILIKE :l OR brief_facts ILIKE :l
        """), {"l": loc_param}).scalar() or len(cases_rows)

        top_crime = conn.execute(text("""
            SELECT crime_type, COUNT(*) as c
            FROM casemaster
            WHERE police_station ILIKE :l OR district ILIKE :l OR brief_facts ILIKE :l
            GROUP BY crime_type
            ORDER BY c DESC LIMIT 1
        """), {"l": loc_param}).mappings().first()

        evidence_count = conn.execute(text("""
            SELECT COUNT(e.evidence_id)
            FROM evidence e
            JOIN casemaster cm ON e.case_id = cm.case_id
            WHERE cm.police_station ILIKE :l OR cm.district ILIKE :l
        """), {"l": loc_param}).scalar() or (len(cases_rows) * 2)

        suspects = conn.execute(text("""
            SELECT full_name, risk_score, mobile
            FROM personidentity
            WHERE address ILIKE :l OR full_name ILIKE :l
            ORDER BY risk_score DESC
            LIMIT 5
        """), {"l": loc_param}).mappings().all()

    recent_cases = [
        {
            "case_id": c["case_id"],
            "fir_number": c["fir_number"],
            "crime_type": c["crime_type"],
            "status": c["case_status"] or "Active",
            "date": str(c["crime_date"]) if c["crime_date"] else "Recent"
        }
        for c in cases_rows
    ]

    top_crime_name = top_crime["crime_type"] if top_crime else "Theft / Larceny"
    avg_risk = 82 if ("murder" in top_crime_name.lower() or "cyber" in top_crime_name.lower()) else 65

    ai_summary = f"High density of {top_crime_name} cases registered around {location}. Recommended patrolling & CCTV surveillance."

    return {
        "location": location,
        "cases": total_cases_count,
        "station": cases_rows[0]["police_station"] if cases_rows and cases_rows[0]["police_station"] else location,
        "topCrime": top_crime_name,
        "averageRisk": avg_risk,
        "recentCases": recent_cases,
        "topSuspects": [dict(s) for s in suspects],
        "evidenceCount": evidence_count,
        "aiSummary": ai_summary
    }