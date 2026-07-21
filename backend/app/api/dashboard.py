from fastapi import APIRouter
from sqlalchemy import text
from app.database.connection import engine

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def dashboard_stats():

    with engine.connect() as conn:

        total_cases = conn.execute(
            text("SELECT COUNT(*) FROM casemaster")
        ).scalar()

        open_cases = conn.execute(
            text("SELECT COUNT(*) FROM casemaster WHERE case_status ILIKE '%pending%' OR case_status ILIKE '%investigation%' OR case_status ILIKE '%open%' OR case_status IS NULL")
        ).scalar()

        closed_cases = conn.execute(
            text("SELECT COUNT(*) FROM casemaster WHERE case_status ILIKE '%closed%' OR case_status ILIKE '%solved%'")
        ).scalar()

        total_criminals = conn.execute(
            text("SELECT COUNT(*) FROM personidentity WHERE risk_score >= 70")
        ).scalar()

        total_complainants = conn.execute(
            text("SELECT COUNT(*) FROM complainantdetails")
        ).scalar()

        total_vehicles = conn.execute(
            text("SELECT COUNT(*) FROM vehicle")
        ).scalar()

        total_evidence = conn.execute(
            text("SELECT COUNT(*) FROM evidence")
        ).scalar()

        return {
            "total_cases": total_cases,
            "open_cases": open_cases,
            "closed_cases": closed_cases,
            "criminals": total_criminals,
            "complainants": total_complainants,
            "vehicles": total_vehicles,
            "evidence": total_evidence
        }