import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/livekit", tags=["LiveKit"])

# Load credentials
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")

class TokenRequest(BaseModel):
    room_name: str
    participant_name: str

@router.post("/token")
def get_token(request: TokenRequest):
    # Simulated LiveKit Token generation to eliminate server dependencies
    return {
        "token": f"mocked_secure_jwt_token_for_{request.participant_name}_room_{request.room_name}",
        "server_url": LIVEKIT_URL
    }

