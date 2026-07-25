import os
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
GEMINI_ENABLED = True

def get_client():
    if not API_KEY or API_KEY == "your_gemini_api_key":
        raise Exception(
            "Gemini API key is not configured. Please set a valid GEMINI_API_KEY or "
            "GOOGLE_API_KEY in your backend/.env file."
        )
    return genai.Client(api_key=API_KEY)

def ask_gemini(prompt: str, system_prompt: str = None, temperature: float = 0.7, max_tokens: int = 1000) -> str:
    if not GEMINI_ENABLED:
        raise Exception(
            "Gemini is temporarily disabled (GEMINI_ENABLED=False in gemini_client.py). "
            "Set GEMINI_ENABLED=True to re-enable."
        )

    client = get_client()

    # Prepare configuration parameters for the google-genai SDK
    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=temperature,
        max_output_tokens=max_tokens,
    )

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=config
            )
            return response.text

        except Exception as e:
            print(f"Attempt {attempt+1}: {e}")
            if "API_KEY_INVALID" in str(e) or "API key not valid" in str(e):
                raise Exception(
                    "Invalid Gemini API key. Please verify the GOOGLE_API_KEY / "
                    "GEMINI_API_KEY in your backend/.env file."
                )
            time.sleep(2)

    raise Exception("Gemini service unavailable.")