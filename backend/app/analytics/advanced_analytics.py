from sqlalchemy import text
from app.database.connection import engine


def officer_workload(db):
    """Returns workload per investigation officer (cases assigned to their station)."""
    with engine.connect() as conn:
        results = conn.execute(
            text("""
                SELECT
                    io.officer_id,
                    io.name AS officer_name,
                    io.rank,
                    io.badge_number,
                    io.police_station,
                    COUNT(cm.case_id) AS total_cases,
                    SUM(CASE WHEN cm.case_status ILIKE '%solved%' OR cm.case_status ILIKE '%closed%' THEN 1 ELSE 0 END) AS closed_cases,
                    SUM(CASE WHEN cm.case_status ILIKE '%pending%' OR cm.case_status ILIKE '%investigation%' OR cm.case_status ILIKE '%open%' OR cm.case_status IS NULL THEN 1 ELSE 0 END) AS open_cases
                FROM investigationofficer io
                LEFT JOIN casemaster cm ON cm.police_station = io.police_station
                GROUP BY io.officer_id, io.name, io.rank, io.badge_number, io.police_station
                ORDER BY total_cases DESC
                LIMIT 20
            """)
        ).mappings().all()

        return [
            {
                "officer_id": row["officer_id"],
                "officer_name": row["officer_name"],
                "rank": row["rank"],
                "badge_number": row["badge_number"],
                "police_station": row["police_station"],
                "total_cases": row["total_cases"] or 0,
                "closed_cases": row["closed_cases"] or 0,
                "open_cases": row["open_cases"] or 0,
                "completion_rate": round(
                    (row["closed_cases"] / row["total_cases"] * 100)
                    if row["total_cases"] and row["total_cases"] > 0 else 0,
                    1
                )
            }
            for row in results
        ]


def get_case_status_breakdown(db):
    """Returns total case counts grouped by status."""
    with engine.connect() as conn:
        results = conn.execute(
            text("""
                SELECT
                    COALESCE(case_status, 'Unknown') AS case_status,
                    COUNT(*) AS total
                FROM casemaster
                GROUP BY case_status
                ORDER BY total DESC
            """)
        ).mappings().all()
        return [{"status": row["case_status"], "total": row["total"]} for row in results]


def get_high_risk_alerts(db):
    """Returns recent high-risk cases and persons needing attention."""
    with engine.connect() as conn:
        # High risk suspects (risk_score >= 85)
        high_risk_suspects = conn.execute(
            text("""
                SELECT person_id, full_name, risk_score, mobile, address
                FROM personidentity
                WHERE risk_score >= 85
                ORDER BY risk_score DESC
                LIMIT 10
            """)
        ).mappings().all()

        # Recent open cases (last 30 days conceptually — use latest by id)
        recent_open = conn.execute(
            text("""
                SELECT case_id, fir_number, crime_type, district, police_station, crime_date
                FROM casemaster
                WHERE case_status ILIKE '%pending%' OR case_status ILIKE '%open%' OR case_status IS NULL
                ORDER BY case_id DESC
                LIMIT 8
            """)
        ).mappings().all()

        # Repeat offenders with 3+ cases
        repeat_high = conn.execute(
            text("""
                SELECT p.person_id, p.full_name, p.risk_score, COUNT(h.history_id) as case_count
                FROM personidentity p
                JOIN criminalhistory h ON p.person_id = h.person_id
                GROUP BY p.person_id, p.full_name, p.risk_score
                HAVING COUNT(h.history_id) >= 3
                ORDER BY case_count DESC
                LIMIT 5
            """)
        ).mappings().all()

        return {
            "high_risk_suspects": [dict(r) for r in high_risk_suspects],
            "recent_open_cases": [dict(r) for r in recent_open],
            "habitual_offenders": [dict(r) for r in repeat_high]
        }


def get_predictions(db):
    """Simple rule-based crime prediction based on historical pattern analysis."""
    with engine.connect() as conn:
        # Crime type frequency by district
        district_crime_patterns = conn.execute(
            text("""
                SELECT district, crime_type, COUNT(*) as frequency
                FROM casemaster
                WHERE district IS NOT NULL AND crime_type IS NOT NULL
                GROUP BY district, crime_type
                ORDER BY district, frequency DESC
            """)
        ).mappings().all()

        # Group by district -> top crime type
        district_map = {}
        for row in district_crime_patterns:
            d = row["district"]
            if d not in district_map:
                district_map[d] = {"district": d, "dominant_crime": row["crime_type"], "frequency": row["frequency"], "risk_level": "Medium"}

        # Assign risk levels
        predictions = []
        for d, data in district_map.items():
            freq = data["frequency"]
            if freq >= 10:
                data["risk_level"] = "High"
                data["warning"] = f"High frequency of {data['dominant_crime']} crimes detected. Recommend enhanced patrol."
            elif freq >= 5:
                data["risk_level"] = "Medium"
                data["warning"] = f"Moderate crime pattern in {d}. Monitor closely."
            else:
                data["risk_level"] = "Low"
                data["warning"] = f"Low baseline crime. Maintain standard patrol schedules."
            predictions.append(data)

        predictions.sort(key=lambda x: x["frequency"], reverse=True)
        return predictions[:15]
