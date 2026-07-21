"""
AI API router.
Preserves existing /ai/query and /ai/investigate endpoints.
Adds new /api/ai/chat, /api/ai/history, /api/ai/voice.
"""
import logging
from typing import Any, Optional, List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_officer, get_jurisdiction_filter
from app.auth.models import Officer
from app.database.connection import get_db
from app.services.ai_service import process_query, process_investigation_query

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
    """
    New AI chat endpoint with full pipeline:
    Intent → SQL → Execute → Gemini formats → Response

    Supports streaming via request.stream=True.
    Maintains conversation history per officer session.
    """
    from app.ai.chat_service import ChatService
    from app.ai.conversation_store import get_history

    # Build session key
    if request.session_id:
        session_key = request.session_id
    elif officer:
        session_key = f"officer_{officer.id}"
    else:
        session_key = "anonymous"

    service = ChatService(session_key)

    # Streaming response
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

    # Standard response
    result = await service.chat(request.message, jurisdiction)
    return result


@router.get("/api/ai/history")
def get_history(
    session_id: Optional[str] = None,
    officer: Optional[Officer] = Depends(get_current_officer),
):
    """Return conversation history for the current session."""
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
    """Clear conversation history for the current session."""
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
    """
    Process a voice transcript through the same AI pipeline as /chat.
    The frontend sends the Web Speech API transcript here.
    """
    from app.ai.chat_service import ChatService

    session_key = request.session_id or (f"officer_{officer.id}" if officer else "voice_anonymous")
    service = ChatService(session_key)
    result = await service.chat(request.transcript, jurisdiction)
    result["input_type"] = "voice"
    return result


@router.get("/api/ai/health")
def ai_health():
    """Check AI provider health."""
    try:
        from app.core.provider_factory import get_ai_provider
        provider = get_ai_provider()
        return provider.health_check()
    except Exception as exc:
        return {"status": "error", "error": str(exc)}
