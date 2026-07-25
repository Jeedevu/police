"""
AI API router.
Preserves existing /ai/query and /ai/investigate endpoints.
Adds /api/ai/chat, /api/ai/history, /api/ai/voice.
Adds Criminal Face Intelligence endpoints (/api/ai/face-search, /api/ai/face-criminals).
"""
import logging
import random
from typing import Any, Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_officer, get_jurisdiction_filter
from app.auth.models import Officer
from app.database.connection import get_db
from app.services.ai_service import process_query, process_investigation_query
from app.api.face_intelligence_data import CRIMINALS_DATASET

logger = logging.getLogger(__name__)

router = APIRouter(tags=["AI"])


# ── Shared schemas ─────────────────────────────────────────────────────────────

class HistoryItem(BaseModel):
    role: str
    content: str


class QueryRequest(BaseModel):
    question: str
    history: Optional[List[HistoryItem]] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    stream: bool = False
    history: Optional[List[HistoryItem]] = None


class VoiceRequest(BaseModel):
    transcript: str
    session_id: Optional[str] = None


# ── Legacy endpoints (unchanged) ──────────────────────────────────────────────

@router.post("/ai/query")
def query(request: QueryRequest):
    """Legacy SQL-query endpoint. Preserved for backward compatibility."""
    history = [h.dict() for h in request.history] if request.history else []
    return process_query(request.question, history)


@router.post("/ai/investigate")
def investigate(request: QueryRequest):
    """Legacy investigation endpoint. Preserved for backward compatibility."""
    history = [h.dict() for h in request.history] if request.history else []
    return process_investigation_query(request.question, history)


# ── New chat endpoints ─────────────────────────────────────────────────────────

@router.post("/api/ai/chat")
async def chat(
    request: ChatRequest,
    officer: Optional[Officer] = Depends(get_current_officer),
    jurisdiction: dict = Depends(get_jurisdiction_filter),
    db: Session = Depends(get_db),
):
    from app.ai.chat_service import ChatService

    if request.session_id:
        session_key = request.session_id
    elif officer:
        session_key = f"officer_{officer.id}"
    else:
        session_key = "anonymous"

    service = ChatService(session_key)

    if request.stream:
        async def stream_generator():
            async for chunk in service.stream_chat(request.message, jurisdiction):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(
            stream_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    result = await service.chat(request.message, jurisdiction)
    return result


@router.get("/api/ai/history")
def get_history(
    session_id: Optional[str] = None,
    officer: Optional[Officer] = Depends(get_current_officer),
):
    from app.ai.conversation_store import get_history as fetch_history, get_all_sessions_summary

    if session_id:
        key = session_id
    elif officer:
        key = f"officer_{officer.id}"
    else:
        return {"sessions": get_all_sessions_summary()}

    return {
        "session_key": key,
        "history": fetch_history(key),
    }


@router.delete("/api/ai/history")
def clear_history(
    session_id: Optional[str] = None,
    officer: Optional[Officer] = Depends(get_current_officer),
):
    from app.ai.conversation_store import clear_history as do_clear

    if session_id:
        key = session_id
    elif officer:
        key = f"officer_{officer.id}"
    else:
        raise HTTPException(status_code=400, detail="Provide session_id or authenticate")

    do_clear(key)
    return {"message": "Conversation history cleared", "session_key": key}


@router.post("/api/ai/voice")
async def voice_query(
    request: VoiceRequest,
    officer: Optional[Officer] = Depends(get_current_officer),
    jurisdiction: dict = Depends(get_jurisdiction_filter),
):
    from app.ai.chat_service import ChatService

    session_key = request.session_id or (f"officer_{officer.id}" if officer else "voice_anonymous")
    service = ChatService(session_key)
    result = await service.chat(request.transcript, jurisdiction)
    result["input_type"] = "voice"
    return result


# ── AI CRIMINAL FACE INTELLIGENCE ENDPOINTS ─────────────────────────────────────

@router.get("/api/ai/face-criminals")
@router.get("/ai/face-criminals")
def get_face_criminals():
    """Return dataset of 15 seeded Karnataka criminals for investigation demo."""
    return {"criminals": CRIMINALS_DATASET, "total": len(CRIMINALS_DATASET)}


@router.get("/api/criminals/{criminal_id}")
def get_criminal_by_id(criminal_id: str):
    """Fetch single criminal profile by ID."""
    for c in CRIMINALS_DATASET:
        if c["criminal_id"] == criminal_id:
            return c
    raise HTTPException(status_code=404, detail="Criminal profile not found")


@router.get("/api/criminals/{criminal_id}/cases")
def get_criminal_cases(criminal_id: str):
    """Fetch FIR cases associated with a criminal."""
    for c in CRIMINALS_DATASET:
        if c["criminal_id"] == criminal_id:
            return {"criminal_id": criminal_id, "cases": c.get("firs", [])}
    return {"criminal_id": criminal_id, "cases": []}


@router.get("/api/criminals/{criminal_id}/evidence")
def get_criminal_evidence(criminal_id: str):
    """Fetch evidence files associated with a criminal."""
    for c in CRIMINALS_DATASET:
        if c["criminal_id"] == criminal_id:
            return {"criminal_id": criminal_id, "evidence": c.get("evidence_files", [])}
    return {"criminal_id": criminal_id, "evidence": []}


@router.post("/api/ai/face-search")
@router.post("/ai/face-search")
async def face_search(
    image: Optional[UploadFile] = File(None),
    criminal_id: Optional[str] = Form(None)
):
    """
    Simulated 512-D Facial Recognition Vector Search endpoint.
    Selects target criminal from dataset, generates simulated confidence (94.5%–99.2%),
    and calls Google Gemini to generate dynamic police investigation reports.
    """
    target = CRIMINALS_DATASET[0]

    if criminal_id:
        found = next((c for c in CRIMINALS_DATASET if c["criminal_id"] == criminal_id), None)
        if found:
            target = found
    elif image and image.filename:
        # Match based on filename hash or index
        filename_hash = sum(ord(ch) for ch in image.filename)
        idx = filename_hash % len(CRIMINALS_DATASET)
        target = CRIMINALS_DATASET[idx]

    confidence = round(random.uniform(94.5, 99.2), 1)

    # Call Gemini for dynamic police summary if available
    ai_summary_text = (
        f"{target['name']} ({target['alias']}) is a high-priority syndicate operative wanted across {target['district']} "
        f"for {', '.join(target['crime_types'])}. Currently classified as {target['wanted_status']} with a risk rating of {target['risk_score']}/100."
    )

    try:
        from app.core.provider_factory import get_ai_provider
        provider = get_ai_provider()
        prompt = (
            f"Generate a professional police investigation report for suspect {target['name']} (Alias: {target['alias']}), "
            f"wanted in district {target['district']} under police station {target['police_station']} for {', '.join(target['crime_types'])}. "
            f"Provide 4 concise sections: 1. Behaviour Pattern, 2. Known Crime Trends, 3. Likely Next Location, 4. Recommended Actions."
        )
        gemini_res = provider.generate_response(prompt=prompt)
        if gemini_res:
            ai_summary_text = gemini_res
    except Exception as exc:
        logger.warning(f"Gemini API call for face search summary failed, using structured template: {exc}")

    ai_report = {
        "summary": ai_summary_text,
        "behavior_pattern": "Operates primarily during late evening hours utilizing stolen high-speed vehicles. Known to switch burner SIM cards after major strikes.",
        "crime_trends": f"Specializes in organized {', '.join(target['crime_types'])}. Frequent activity reported near border transit hubs.",
        "next_location": f"Highest probability hideouts: Border districts surrounding {target['district']}, key transport hubs, and safehouses managed by associates.",
        "recommended_actions": "1. Issue immediate statewide Lookout Circular (LOC).\n2. Deploy Special Tactical Unit (STU) for interception.\n3. Freeze known hawala transaction routes.",
        "officer_notes": "CONFIDENTIAL — Suspect is considered armed & dangerous. Exercise extreme caution during tactical interception."
    }

    return {
        "match": True,
        "confidence": confidence,
        "risk": target.get("threat_level", "HIGH"),
        "criminal": target,
        "cases": target.get("firs", []),
        "evidence": target.get("evidence_files", []),
        "associates": target.get("associates", []),
        "summary": ai_summary_text,
        "ai_report": ai_report
    }


@router.post("/api/reports/criminal-dossier")
def generate_dossier_meta(payload: dict):
    """API metadata generator for PDF Executive Dossiers."""
    cid = payload.get("criminal_id", "CRM-2026-8801")
    target = next((c for c in CRIMINALS_DATASET if c["criminal_id"] == cid), CRIMINALS_DATASET[0])
    return {
        "success": True,
        "dossier_id": f"DOSSIER-KSP-{target['criminal_id']}",
        "criminal": target,
        "status": "APPROVED FOR PRINT"
    }


@router.get("/api/ai/health")
def ai_health():
    """Check AI provider health."""
    try:
        from app.core.provider_factory import get_ai_provider
        provider = get_ai_provider()
        return provider.health_check()
    except Exception as exc:
        return {"status": "error", "error": str(exc)}
