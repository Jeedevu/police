import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Square,
  Globe,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  Radio,
  Send,
  Move,
  GripVertical,
} from "lucide-react";
import sarvamService, { SARVAM_LANGUAGES } from "../../services/sarvamService";

export default function SarvamSpeechAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("kn-IN");
  
  // State machine: "idle" | "listening" | "transcribing" | "thinking" | "speaking"
  const [status, setStatus] = useState("idle");
  const [handsFree, setHandsFree] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [textInput, setTextInput] = useState("");
  const [audioUrls, setAudioUrls] = useState([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(new Audio());
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle audio playback end -> trigger hands-free auto-mic if enabled
  useEffect(() => {
    const audioElement = audioRef.current;
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (currentAudioIndex < audioUrls.length - 1) {
        const nextIndex = currentAudioIndex + 1;
        setCurrentAudioIndex(nextIndex);
        audioElement.src = audioUrls[nextIndex];
        audioElement.play().then(() => setIsPlaying(true)).catch(console.error);
      } else {
        setStatus("idle");
        if (handsFree && isOpen) {
          setTimeout(() => {
            startRecording();
          }, 800);
        }
      }
    };

    audioElement.addEventListener("ended", handleEnded);
    return () => audioElement.removeEventListener("ended", handleEnded);
  }, [audioUrls, currentAudioIndex, handsFree, isOpen]);

  // Audio Canvas Visualizer
  const visualizeAudio = (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 64;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;

        animationFrameRef.current = requestAnimationFrame(draw);
        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, width, height);
        const barWidth = (width / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height;
          ctx.fillStyle = `rgba(59, 130, 246, ${Math.max(0.3, dataArray[i] / 255)})`;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      };

      draw();
    } catch (e) {
      console.warn("Audio Context visualization unavailable:", e);
    }
  };

  // Start Microphone Recording
  const startRecording = async () => {
    setErrorMessage("");
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size > 500) {
          await processVoiceAudio(audioBlob);
        } else {
          setStatus("idle");
        }
      };

      mediaRecorderRef.current.start(200);
      setStatus("listening");
      visualizeAudio(stream);
    } catch (err) {
      console.error("Microphone access error:", err);
      setErrorMessage("Microphone permission denied. Please allow microphone access.");
      setStatus("idle");
    }
  };

  // Stop Microphone Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setStatus("transcribing");
    }
  };

  // Process Recorded Speech Blob (STT -> Gemini -> TTS)
  const processVoiceAudio = async (audioBlob) => {
    try {
      setStatus("transcribing");
      const sttResult = await sarvamService.transcribeSpeech(audioBlob, selectedLanguage);
      const text = sttResult.transcript || "";
      setTranscript(text);

      if (!text || sttResult.status === "error" || sttResult.status === "failed") {
        setErrorMessage("Could not recognize speech. Please try again.");
        setStatus("idle");
        return;
      }

      setStatus("thinking");
      const chatResult = await sarvamService.sendChatMessage(text, selectedLanguage, true);
      setAiResponse(chatResult.response || "");

      const urls = chatResult.tts?.audio_urls || [];
      if (urls.length > 0 && !isMuted) {
        setAudioUrls(urls);
        setCurrentAudioIndex(0);
        setStatus("speaking");
        audioRef.current.src = urls[0];
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      } else {
        setStatus("idle");
      }
    } catch (err) {
      console.error("Voice processing error:", err);
      setErrorMessage("Failed to process voice request. Please check backend connection.");
      setStatus("idle");
    }
  };

  // Send Text Prompt manually
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || status !== "idle") return;

    const userText = textInput.trim();
    setTextInput("");
    setTranscript(userText);
    setErrorMessage("");

    try {
      setStatus("thinking");
      const chatResult = await sarvamService.sendChatMessage(userText, selectedLanguage, true);
      setAiResponse(chatResult.response || "");

      const urls = chatResult.tts?.audio_urls || [];
      if (urls.length > 0 && !isMuted) {
        setAudioUrls(urls);
        setCurrentAudioIndex(0);
        setStatus("speaking");
        audioRef.current.src = urls[0];
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      } else {
        setStatus("idle");
      }
    } catch (err) {
      console.error("Text chat error:", err);
      setErrorMessage("Service query error.");
      setStatus("idle");
    }
  };

  // Playback Control Handlers
  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (audioUrls.length > 0) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      setStatus("speaking");
    }
  };

  const handleStop = () => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setStatus("idle");
  };

  const handleReplay = () => {
    if (audioUrls.length > 0) {
      setCurrentAudioIndex(0);
      audioRef.current.src = audioUrls[0];
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      setStatus("speaking");
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end cursor-grab active:cursor-grabbing touch-none select-none"
    >
      {/* Floating Widget Panel */}
      {isOpen && (
        <div
          className={`bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-2xl transition-all duration-300 overflow-hidden mb-4 ${
            isMinimized ? "w-80 h-16" : "w-96 max-w-[calc(100vw-2rem)]"
          }`}
        >
          {/* Draggable Header */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-2">
              <GripVertical size={16} className="text-slate-500 hover:text-slate-300" />
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Sparkles size={16} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  Sarvam Voice Assistant
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Bulbul V3
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Move size={10} className="text-slate-500" /> Draggable • 10 Languages
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button
                onClick={() => {
                  stopRecording();
                  handleStop();
                  setIsOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto cursor-default">
              {/* Language Selector & Controls */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pl-8 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition appearance-none cursor-pointer"
                  >
                    {SARVAM_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                  <Globe size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                </div>

                {/* Hands-Free Toggle */}
                <button
                  onClick={() => setHandsFree(!handsFree)}
                  title={handsFree ? "Hands-Free Auto-Mic Active" : "Manual Mic Mode"}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    handsFree
                      ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Radio size={14} className={handsFree ? "animate-pulse text-blue-400" : ""} />
                  <span>Hands-Free</span>
                </button>
              </div>

              {/* Status Badge & Audio Wave Visualizer */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-center relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        status === "listening"
                          ? "bg-red-500 animate-ping"
                          : status === "speaking"
                          ? "bg-emerald-400 animate-pulse"
                          : status === "thinking"
                          ? "bg-amber-400 animate-spin"
                          : "bg-blue-500"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {status === "listening" && "Listening to Voice..."}
                      {status === "transcribing" && "Processing Saarika STT..."}
                      {status === "thinking" && "Gemini 2.5 Intelligence..."}
                      {status === "speaking" && "Sarvam Bulbul Voice Playback..."}
                      {status === "idle" && "Ready for Voice Input"}
                    </span>
                  </div>

                  {/* Playback controls */}
                  <div className="flex items-center gap-1">
                    {audioUrls.length > 0 && (
                      <>
                        <button
                          onClick={handlePlayPause}
                          className="p-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition"
                        >
                          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button
                          onClick={handleReplay}
                          className="p-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg transition"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          onClick={handleStop}
                          className="p-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg transition"
                        >
                          <Square size={14} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-1.5 rounded-lg transition ${
                        isMuted ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* Canvas Waveform */}
                <div className="h-10 w-full flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden mb-1">
                  {status === "listening" ? (
                    <canvas ref={canvasRef} width={300} height={40} className="w-full h-full" />
                  ) : (
                    <div className="flex items-center gap-1">
                      {[40, 70, 30, 90, 50, 80, 40, 60, 90, 30, 70, 50].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${status === "speaking" ? (h * (i % 2 === 0 ? 0.8 : 1)) : 8}px` }}
                          className={`w-1.5 rounded-full transition-all duration-300 ${
                            status === "speaking" ? "bg-emerald-400 animate-pulse" : "bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Main Microphone Button */}
                <div className="pt-2 flex justify-center">
                  <button
                    onClick={status === "listening" ? stopRecording : startRecording}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
                      status === "listening"
                        ? "bg-red-500 text-white shadow-red-500/50 animate-pulse scale-105"
                        : status === "speaking"
                        ? "bg-emerald-500 text-white shadow-emerald-500/50"
                        : "bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-blue-500/30 hover:scale-105"
                    }`}
                  >
                    {status === "listening" ? (
                      <MicOff size={28} />
                    ) : (
                      <Mic size={28} className={status === "speaking" ? "animate-spin" : ""} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Live Transcript & AI Response Box */}
              <div className="space-y-2 text-xs">
                {transcript && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                      🗣️ You Said:
                    </p>
                    <p className="text-slate-200 leading-relaxed">{transcript}</p>
                  </div>
                )}

                {aiResponse && (
                  <div className="bg-blue-950/30 p-3 rounded-xl border border-blue-500/20">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                      🤖 Sarvam Voice Response:
                    </p>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
                  </div>
                )}
              </div>

              {/* Manual Text Input Form */}
              <form onSubmit={handleTextSubmit} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Or type voice query..."
                  disabled={status !== "idle"}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || status !== "idle"}
                  className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Floating Trigger Launcher Button (Draggable) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-2xl shadow-blue-500/40 hover:scale-105 transition-all duration-300 group relative border border-white/20 cursor-grab active:cursor-grabbing"
          title="Drag me anywhere or click to open Sarvam Voice Assistant"
        >
          <Mic size={24} className="group-hover:scale-110 transition" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
        </button>
      )}
    </motion.div>
  );
}
