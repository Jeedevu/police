"""
Pydantic v2 schemas for the Evidence module.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class EvidenceOut(BaseModel):
    evidence_id: int
    case_id: int
    evidence_type: Optional[str] = None
    description: Optional[str] = None
    collected_date: Optional[datetime] = None
    collected_by: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None

    model_config = {"from_attributes": True}


class EvidenceUploadResponse(BaseModel):
    success: bool
    message: str
    evidence_id: Optional[int] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    case_id: Optional[int] = None
    # v3.0 Catalyst fields
    file_id: Optional[str] = None           # Catalyst File Store file ID
    storage_backend: Optional[str] = None   # "catalyst" | "local" | "local_fallback"
    ocr_triggered: bool = False             # True if Zia OCR was triggered automatically
    transcript_triggered: bool = False      # True if Zia STT was triggered automatically



class EvidenceListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    data: list[EvidenceOut]


class ChainOfCustodyEntry(BaseModel):
    timestamp: datetime
    officer_name: str
    action: str
    notes: Optional[str] = None
