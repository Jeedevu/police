"""
Backend Sarvam AI Speech-to-Speech Integration Verification Test Script.
"""
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app

client = TestClient(app)

def test_sarvam_speech_integration():
    print("--- 1. Testing GET /api/sarvam/languages ---")
    r_lang = client.get("/api/sarvam/languages")
    assert r_lang.status_code == 200
    languages = r_lang.json().get("languages", {})
    assert "kn-IN" in languages
    assert "hi-IN" in languages
    print("[OK] Supported languages fetched successfully:", len(languages), "languages.")

    print("\n--- 2. Testing POST /api/chat (Gemini 2.5 + Audit Log + Sarvam TTS) ---")
    chat_payload = {
        "prompt": "Show theft case statistics in Bengaluru",
        "language_code": "kn-IN",
        "generate_tts": True,
    }
    r_chat = client.post("/api/chat", json=chat_payload)
    assert r_chat.status_code == 200
    chat_data = r_chat.json()
    assert "response" in chat_data
    assert "tts" in chat_data
    print("[OK] Chat API returned response:", chat_data["response"][:80], "...")

    print("\n--- 3. Testing POST /api/tts (Sarvam Bulbul V3) ---")
    tts_payload = {
        "text": "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ಕ್ರೈಮ್ ಇಂಟೆಲಿಜೆನ್ಸ್",
        "language_code": "kn-IN",
    }
    r_tts = client.post("/api/tts", json=tts_payload)
    assert r_tts.status_code == 200
    tts_data = r_tts.json()
    assert "audios" in tts_data or "audio_urls" in tts_data
    print("[OK] TTS API endpoint returned status:", tts_data.get("status"))

    print("\n--- 4. Testing POST /api/stt (Sarvam Saarika STT Endpoint Validation) ---")
    fake_audio = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\x3e\x00\x00\x00\x7d\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00" + b"\x00" * 200
    r_stt = client.post(
        "/api/stt",
        files={"file": ("test.wav", fake_audio, "audio/wav")},
        data={"language_code": "kn-IN"},
    )
    assert r_stt.status_code == 200
    stt_data = r_stt.json()
    assert "transcript" in stt_data
    print("[OK] STT API endpoint executed with status:", stt_data.get("status"))

    print("\n=== ALL SARVAM AI SPEECH-TO-SPEECH VERIFICATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_sarvam_speech_integration()
