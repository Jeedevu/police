import api from "./api";

export const SARVAM_LANGUAGES = [
  { code: "kn-IN", name: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳" },
  { code: "hi-IN", name: "हिंदी (Hindi)", flag: "🇮🇳" },
  { code: "ta-IN", name: "தமிழ் (Tamil)", flag: "🇮🇳" },
  { code: "te-IN", name: "తెలుగు (Telugu)", flag: "🇮🇳" },
  { code: "ml-IN", name: "മലയാളം (Malayalam)", flag: "🇮🇳" },
  { code: "mr-IN", name: "मराठी (Marathi)", flag: "🇮🇳" },
  { code: "bn-IN", name: "বাংলা (Bengali)", flag: "🇮🇳" },
  { code: "gu-IN", name: "ગુજરાતી (Gujarati)", flag: "🇮🇳" },
  { code: "pa-IN", name: "ਪੰਜਾਬੀ (Punjabi)", flag: "🇮🇳" },
  { code: "en-IN", name: "English (India)", flag: "🇮🇳" },
];

export const sarvamService = {
  /**
   * Upload microphone audio blob to Sarvam STT.
   */
  async transcribeSpeech(audioBlob, languageCode = "kn-IN") {
    const formData = new FormData();
    formData.append("file", audioBlob, "speech_recording.webm");
    formData.append("language_code", languageCode);

    const response = await api.post("/api/stt", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Send query text prompt to Gemini & synthesize Sarvam Bulbul V3 TTS.
   */
  async sendChatMessage(prompt, languageCode = "kn-IN", generateTts = true) {
    const response = await api.post("/api/chat", {
      prompt,
      language_code: languageCode,
      generate_tts: generateTts,
    });
    return response.data;
  },

  /**
   * Convert text into Sarvam Bulbul V3 voice audio.
   */
  async synthesizeTextToSpeech(text, languageCode = "kn-IN", speaker = null) {
    const response = await api.post("/api/tts", {
      text,
      language_code: languageCode,
      speaker,
    });
    return response.data;
  },

  /**
   * Complete End-to-End Speech-to-Speech call.
   */
  async speechToSpeech(audioBlob, languageCode = "kn-IN") {
    const formData = new FormData();
    formData.append("file", audioBlob, "speech_recording.webm");
    formData.append("language_code", languageCode);

    const response = await api.post("/api/speech-to-speech", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

export default sarvamService;
