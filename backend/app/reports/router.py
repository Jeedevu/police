"""
Reports router — generate investigation reports as JSON (PDF generation is frontend-side).
POST /api/reports/pdf  → returns report data for frontend to render as PDF
POST /api/reports/case → returns AI-generated case summary
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_officer, require_officer
from app.auth.models import Officer
from app.database.connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reports", tags=["Reports"])


class ReportRequest(BaseModel):
    case_id: Optional[int] = None
    report_type: str = "case_summary"  # case_summary | district_crime | officer_performance
    district: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    include_evidence: bool = True
    include_suspects: bool = True


@router.post("/pdf")
async def generate_pdf_report(
    request: ReportRequest,
    db: Session = Depends(get_db),
    officer: Officer = Depends(require_officer),
):
    """
    Generate a structured report for PDF rendering on the frontend.
    Returns JSON with case details, suspects, evidence, and AI-generated summary.
    """
    from sqlalchemy import text

    report_data = {
        "report_type": request.report_type,
        "generated_by": officer.full_name,
        "generated_at": __import__("datetime").datetime.now().isoformat(),
        "organization": "Karnataka State Police",
    }

    if request.report_type == "case_summary" and request.case_id:
        with db.bind.connect() as conn:
            # Fetch case
            case = conn.execute(
                text("SELECT * FROM casemaster WHERE case_id = :id"),
                {"id": request.case_id}
            ).mappings().first()

            if not case:
                raise HTTPException(status_code=404, detail="Case not found")

            report_data["case"] = dict(case)

            if request.include_suspects:
                accused = conn.execute(
                    text("SELECT * FROM accused WHERE case_id = :id"),
                    {"id": request.case_id}
                ).mappings().all()
                report_data["accused"] = [dict(a) for a in accused]

                victims = conn.execute(
                    text("SELECT * FROM victim WHERE case_id = :id"),
                    {"id": request.case_id}
                ).mappings().all()
                report_data["victims"] = [dict(v) for v in victims]

            if request.include_evidence:
                evidence = conn.execute(
                    text("SELECT * FROM evidence WHERE case_id = :id"),
                    {"id": request.case_id}
                ).mappings().all()
                report_data["evidence"] = [dict(e) for e in evidence]

        # Generate AI summary
        try:
            from app.core.provider_factory import get_ai_provider
            provider = get_ai_provider()
            case_json = str(report_data.get("case", {}))[:500]
            ai_summary = provider.ask(
                prompt=f"Summarize this Karnataka Police case for a formal report:\n{case_json}",
                system_prompt="You are a police report writer. Write a formal, factual summary in 3-5 sentences.",
                temperature=0.3,
                max_tokens=400,
            )
            report_data["ai_summary"] = ai_summary
        except Exception as exc:
            logger.warning(f"AI summary generation failed: {exc}")
            report_data["ai_summary"] = "AI summary unavailable."

    elif request.report_type == "district_crime" and request.district:
        with db.bind.connect() as conn:
            crimes = conn.execute(
                text("""
                    SELECT crime_type, COUNT(*) as count, district
                    FROM casemaster
                    WHERE district ILIKE :district
                    GROUP BY crime_type, district
                    ORDER BY count DESC
                """),
                {"district": f"%{request.district}%"}
            ).mappings().all()
            report_data["crime_stats"] = [dict(c) for c in crimes]
            report_data["district"] = request.district

    return {"success": True, "report": report_data}


@router.post("/case-summary")
async def generate_case_summary(
    case_id: int,
    db: Session = Depends(get_db),
    _: Officer = Depends(require_officer),
):
    """Generate an AI-powered investigation summary for a case."""
    from sqlalchemy import text
    from app.core.provider_factory import get_ai_provider

    with db.bind.connect() as conn:
        case = conn.execute(
            text("SELECT * FROM casemaster WHERE case_id = :id"),
            {"id": case_id}
        ).mappings().first()

        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        accused = conn.execute(
            text("SELECT name, gender, age, address FROM accused WHERE case_id = :id"),
            {"id": case_id}
        ).mappings().all()

        evidence = conn.execute(
            text("SELECT evidence_type, description FROM evidence WHERE case_id = :id"),
            {"id": case_id}
        ).mappings().all()

    case_context = f"""
Case ID: {case_id}
FIR: {case['fir_number']}
Crime Type: {case['crime_type']}
District: {case['district']}
Police Station: {case['police_station']}
Date: {case['crime_date']}
Status: {case['case_status']}
Brief Facts: {case.get('brief_facts', 'N/A')}
Accused: {[a['name'] for a in accused]}
Evidence Items: {len(evidence)}
"""

    provider = get_ai_provider()
    summary = provider.ask(
        prompt=f"Generate a detailed investigation summary:\n{case_context}",
        system_prompt="""You are a senior police investigation analyst for Karnataka Police.
Generate a comprehensive but concise case summary including:
1. Overview of the incident
2. Status of investigation
3. Key suspects and evidence
4. Recommended next steps
Format in professional police report style.""",
        temperature=0.3,
        max_tokens=800,
    )

    return {
        "case_id": case_id,
        "fir_number": case["fir_number"],
        "ai_summary": summary,
    }
