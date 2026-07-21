from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
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
    prefix="/analytics",
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


# ── New required endpoints ────────────────────────────────────────────────────

@router.get("/heatmap")
def api_heatmap(db: Session = Depends(get_db)):
    """GPS-based crime heatmap data for Karnataka."""
    from sqlalchemy import text
    with db.bind.connect() as conn:
        rows = conn.execute(text("""
            SELECT
                district,
                police_station,
                crime_type,
                COUNT(*) as incident_count,
                AVG(CAST(latitude AS float)) as avg_lat,
                AVG(CAST(longitude AS float)) as avg_lng
            FROM casemaster
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            GROUP BY district, police_station, crime_type
            ORDER BY incident_count DESC
            LIMIT 500
        """)).mappings().all()

        district_rows = conn.execute(text("""
            SELECT
                district,
                crime_type,
                COUNT(*) as incident_count
            FROM casemaster
            WHERE district IS NOT NULL
            GROUP BY district, crime_type
            ORDER BY incident_count DESC
        """)).mappings().all()

    return {
        "gps_clusters": [dict(r) for r in rows],
        "district_heatmap": [dict(r) for r in district_rows],
    }


@router.get("/officer-performance")
def api_officer_performance(db: Session = Depends(get_db)):
    """Officer performance metrics — case closure rates, workload."""
    from sqlalchemy import text
    with db.bind.connect() as conn:
        rows = conn.execute(text("""
            SELECT
                io.officer_name,
                io.police_station,
                io.rank,
                COUNT(cm.case_id) AS total_cases,
                COUNT(CASE WHEN cm.case_status ILIKE '%closed%' OR cm.case_status ILIKE '%solved%' THEN 1 END) AS closed_cases,
                COUNT(CASE WHEN cm.case_status ILIKE '%pending%' OR cm.case_status ILIKE '%open%' THEN 1 END) AS open_cases
            FROM investigationofficer io
            LEFT JOIN casemaster cm ON cm.police_station = io.police_station
            GROUP BY io.officer_name, io.police_station, io.rank
            ORDER BY total_cases DESC
            LIMIT 100
        """)).mappings().all()

    performance = []
    for r in rows:
        total = r["total_cases"] or 0
        closed = r["closed_cases"] or 0
        closure_rate = round((closed / total * 100) if total > 0 else 0, 1)
        performance.append({
            **dict(r),
            "closure_rate": closure_rate,
        })

    return {"data": performance}