import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Mic,
  MicOff,
  Send,
  AlertCircle,
  FileText,
  Home,
  User,
  Globe,
  Star,
  Clock,
  ChevronRight,
  Zap,
  Activity,
  Languages as LangIcon,
  Camera,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { DemoNav } from "../components/DemoNav";
import { motion, AnimatePresence } from "motion/react";

// ── Language Configs ──────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en-IN", label: "English", shortLabel: "EN", bcp47: "en" },
  { code: "hi-IN", label: "हिंदी", shortLabel: "हि", bcp47: "hi" },
  { code: "mr-IN", label: "मराठी", shortLabel: "मर", bcp47: "mr" },
  { code: "bn-IN", label: "বাংলা", shortLabel: "বা", bcp47: "bn" },
  { code: "ta-IN", label: "தமிழ்", shortLabel: "த", bcp47: "ta" },
  { code: "te-IN", label: "తెలుగు", shortLabel: "తె", bcp47: "te" },
];

const API_BASE = "http://localhost:5000/api";

type Message = {
  id: string;
  type: "ai" | "user";
  text: string;
  urgency?: string;
  analysis?: any;
  matchingDoctors?: any[];
  image?: string;
};

// ── Typewriter Effect Component ──────────────────────────────────────────────
const Typewriter = ({ text, onComplete }: { text: string, onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, 15); // Adjust speed here
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, onComplete]);

  return <p className="text-sm whitespace-pre-wrap">{displayedText}</p>;
};

export function PatientHome() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [latestDoctors, setLatestDoctors] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [secondImage, setSecondImage] = useState<File | null>(null);
  const [secondImagePreview, setSecondImagePreview] = useState<string | null>(null);
  const [isProgressMode, setIsProgressMode] = useState(false);
  const [userVitals, setUserVitals] = useState({
    height: localStorage.getItem("height") || "",
    weight: localStorage.getItem("weight") || "",
    gender: localStorage.getItem("gender") || "Male",
  });
  const [showVitalsEditor, setShowVitalsEditor] = useState(false);
  const [showPrescription, setShowPrescription] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── Initialize ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
    }
    // Start a chat session
    startSession();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSession = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/chat/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ language: selectedLang.bcp47 }),
      });

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
        setMessages([
          {
            id: "greeting",
            type: "ai",
            text: data.text,
          },
        ]);
      } else {
        // Fallback greeting if backend isn't available
        setMessages([
          {
            id: "greeting",
            type: "ai",
            text: "Hello! 👋 I'm your MediConnect AI health assistant. Tell me your symptoms — you can speak in your language or type here. I'll analyze them and connect you with the right specialist.",
          },
        ]);
      }
    } catch {
      setMessages([
        {
          id: "greeting",
          type: "ai",
          text: "Hello! 👋 I'm your Duckteer AI health assistant. Tell me your symptoms — you can speak in your language or type here.",
        },
      ]);
    }
  };

  // ── Voice Recognition ──────────────────────────────────────────────────────
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang.code; // Crucial: sets the 'ear' to the specific language
    console.log(`[Voice] Starting listener in: ${selectedLang.label} (${selectedLang.code})`);
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      if (final) {
        setInputText((prev) => (prev + " " + final).trim());
      }
      setTranscript(interim);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setTranscript("");
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2 = 1) => {
    const file = e.target.files?.[0];
    if (file) {
      if (slot === 1) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setSecondImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setSecondImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (slot: 1 | 2 = 1) => {
    if (slot === 1) {
      setSelectedImage(null);
      setImagePreview(null);
    } else {
      setSecondImage(null);
      setSecondImagePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Send Message ───────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if ((!text && !selectedImage) || isProcessing) return;

    // Stop listening if active
    if (isListening) stopListening();

    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      text: text || (selectedImage ? "Image uploaded" : ""),
      image: imagePreview || undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    const currentImage = selectedImage;
    const currentSecondImage = secondImage;
    removeImage(1);
    removeImage(2);
    setIsProcessing(true);

    // Show thinking indicator
    const thinkingId = "thinking-" + Date.now();
    setMessages((prev) => [
      ...prev,
      { id: thinkingId, type: "ai", text: currentSecondImage ? "🤔 Comparing your symptoms across both images..." : "🤔 Analyzing your symptoms..." },
    ]);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("text", text);
      formData.append("language", selectedLang.bcp47);
      
      // Add user context for better AI analysis
      const vitalsContext = `User Details: Gender: ${userVitals.gender}, Height: ${userVitals.height}cm, Weight: ${userVitals.weight}kg.`;
      formData.append("context", vitalsContext);

      if (currentImage) {
        formData.append("image", currentImage);
      }
      if (currentSecondImage) {
        formData.append("image", currentSecondImage); // Backend needs to handle multiple 'image' fields
      }

      const res = await fetch(
        `${API_BASE}/chat/${sessionId || "anonymous"}/message`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        }
      );

      // Remove thinking message
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId));

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: "ai-" + Date.now(),
          type: "ai",
          text: data.aiMessage?.text || "I couldn't process that. Could you describe your symptoms differently?",
          urgency: data.analysis?.urgencyLevel,
          analysis: data.analysis,
          matchingDoctors: data.matchingDoctors,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setLatestAnalysis(data.analysis);
        setLatestDoctors(data.matchingDoctors || []);
      } else {
        // Fallback: local analysis if backend unavailable
        const fallbackMsg: Message = {
          id: "ai-" + Date.now(),
          type: "ai",
          text: "I'm having trouble connecting to the analysis service. Please try again in a moment.",
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
      setMessages((prev) => [
        ...prev,
        {
          id: "error-" + Date.now(),
          type: "ai",
          text: "⚠️ Connection issue. Please check if the server is running and try again.",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Urgency color helper ───────────────────────────────────────────────────
  const getUrgencyStyle = (level: string) => {
    switch (level) {
      case "high":
        return { bg: "from-red-50 to-red-100", border: "border-red-300", text: "text-red-700", badge: "bg-red-500" };
      case "medium":
        return { bg: "from-yellow-50 to-amber-100", border: "border-yellow-300", text: "text-yellow-700", badge: "bg-yellow-500" };
      default:
        return { bg: "from-green-50 to-emerald-100", border: "border-green-300", text: "text-green-700", badge: "bg-green-500" };
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <DemoNav />
      <div className="flex-1 md:ml-64 flex flex-col relative">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#084a8f] px-6 pt-16 md:pt-28 pb-6 text-white rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            {/* ── Hackathon Showcase Badge ───────────────────────── */}
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2 py-0.5 bg-yellow-400 text-black text-[10px] font-bold rounded-sm uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Zap className="w-2.5 h-2.5 fill-black" />
                Hackathon Mode
              </div>
              <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-medium rounded-sm uppercase tracking-wider border border-white/30">
                MCP Powered
              </div>
              <div className="px-2 py-0.5 bg-blue-400 text-white text-[10px] font-bold rounded-sm uppercase tracking-wider border border-blue-300">
                SHARP Compliant
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-green-300 animate-pulse" />
              <span className="text-white/80 text-xs">AI Health Assistant — Live</span>
            </div>
            <h1 className="text-2xl mt-1" style={{ fontWeight: 600 }}>
              Duckteer AI
            </h1>
            <p className="text-white/70 text-sm mt-1">
              🏥 Speak your symptoms in your language
            </p>
          </div>
          <Link
            to="/medical-records"
            className="bg-white/20 p-3 rounded-full backdrop-blur-md"
          >
            <User className="w-6 h-6 text-white" />
          </Link>
        </div>

        {/* ── Health Vitals Section ───────────────────────────────────── */}
        <div className="mt-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-300" />
              <span className="text-xs font-bold uppercase tracking-wider">Health Vitals</span>
            </div>
            <button 
              onClick={() => setShowVitalsEditor(!showVitalsEditor)}
              className="text-[10px] bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors uppercase font-bold"
            >
              {showVitalsEditor ? "Close" : "Edit Details"}
            </button>
          </div>

          {!showVitalsEditor ? (
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-[10px] text-white/60 uppercase">Gender</p>
                <p className="text-sm font-bold">{userVitals.gender || "Not Set"}</p>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-white/60 uppercase">Height</p>
                <p className="text-sm font-bold">{userVitals.height ? `${userVitals.height} cm` : "Not Set"}</p>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-white/60 uppercase">Weight</p>
                <p className="text-sm font-bold">{userVitals.weight ? `${userVitals.weight} kg` : "Not Set"}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-white/60 uppercase block mb-1">Gender</label>
                <select 
                  value={userVitals.gender}
                  onChange={(e) => {
                    const v = { ...userVitals, gender: e.target.value };
                    setUserVitals(v);
                    localStorage.setItem("gender", e.target.value);
                  }}
                  className="w-full bg-white/20 border-none rounded-lg p-1.5 text-xs text-white focus:ring-1 focus:ring-white/50 outline-none"
                >
                  <option value="Male" className="text-black">Male</option>
                  <option value="Female" className="text-black">Female</option>
                  <option value="Other" className="text-black">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/60 uppercase block mb-1">Height (cm)</label>
                <input 
                  type="number"
                  placeholder="170"
                  value={userVitals.height}
                  onChange={(e) => {
                    const v = { ...userVitals, height: e.target.value };
                    setUserVitals(v);
                    localStorage.setItem("height", e.target.value);
                  }}
                  className="w-full bg-white/20 border-none rounded-lg p-1.5 text-xs text-white placeholder:text-white/40 focus:ring-1 focus:ring-white/50 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 uppercase block mb-1">Weight (kg)</label>
                <input 
                  type="number"
                  placeholder="70"
                  value={userVitals.weight}
                  onChange={(e) => {
                    const v = { ...userVitals, weight: e.target.value };
                    setUserVitals(v);
                    localStorage.setItem("weight", e.target.value);
                  }}
                  className="w-full bg-white/20 border-none rounded-lg p-1.5 text-xs text-white placeholder:text-white/40 focus:ring-1 focus:ring-white/50 outline-none"
                />
              </div>
            </div>
          )}
        </div>


        {/* ── Language Selector ─────────────────────────────────────────── */}
        <div className="relative">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm hover:bg-white/30 transition-all"
          >
            <Globe className="w-4 h-4" />
            <span>{selectedLang.label}</span>
            <ChevronRight
              className={`w-4 h-4 transition-transform ${showLangPicker ? "rotate-90" : ""}`}
            />
          </button>

          {showLangPicker && (
            <div className="absolute top-12 left-0 z-30 bg-white rounded-2xl shadow-2xl p-2 min-w-[220px] border border-gray-100">
              <p className="px-3 py-2 text-xs text-gray-500" style={{ fontWeight: 600 }}>
                Select your language
              </p>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang);
                    setShowLangPicker(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                    selectedLang.code === lang.code
                      ? "bg-[#e8f4fd] text-[#0A66C2]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  style={{ fontWeight: selectedLang.code === lang.code ? 600 : 400 }}
                >
                  <span className="w-8 h-8 rounded-full bg-[#f0f4f8] flex items-center justify-center text-xs" style={{ fontWeight: 600 }}>
                    {lang.shortLabel}
                  </span>
                  <span>{lang.label}</span>
                  {selectedLang.code === lang.code && (
                    <Zap className="w-4 h-4 text-[#0A66C2] ml-auto" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Container ───────────────────────────────────────────────── */}
      <div className="flex-1 px-4 py-6 overflow-y-auto pb-44" onClick={() => setShowLangPicker(false)}>
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`mb-4 ${message.type === "user" ? "flex justify-end" : ""}`}
            >
            {message.type === "ai" ? (
              <div className="flex gap-3 max-w-[90%]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#084a8f] flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                    <Typewriter text={message.text} />
                  </div>

                  {/* ── Urgency Card ─────────────────────────────────── */}
                  {message.analysis && (
                    <div className="mt-3">
                      {/* Urgency Score Bar */}
                      <div
                        className={`bg-gradient-to-r ${getUrgencyStyle(message.analysis.urgencyLevel).bg} p-4 rounded-2xl border ${getUrgencyStyle(message.analysis.urgencyLevel).border}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertCircle
                              className={`w-5 h-5 ${getUrgencyStyle(message.analysis.urgencyLevel).text}`}
                            />
                            <span
                              className={`text-sm ${getUrgencyStyle(message.analysis.urgencyLevel).text}`}
                              style={{ fontWeight: 700 }}
                            >
                              URGENCY: {message.analysis.urgencyLevel.toUpperCase()}
                            </span>
                          </div>
                          <span
                            className={`text-lg ${getUrgencyStyle(message.analysis.urgencyLevel).text}`}
                            style={{ fontWeight: 800 }}
                          >
                            {message.analysis.urgencyScore}/10
                          </span>
                        </div>

                        {/* Score bar */}
                        <div className="w-full bg-white/60 rounded-full h-2.5 mb-3">
                          <div
                            className={`h-2.5 rounded-full ${getUrgencyStyle(message.analysis.urgencyLevel).badge} transition-all duration-1000`}
                            style={{
                              width: `${message.analysis.urgencyScore * 10}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-3 py-1 bg-white rounded-full text-xs ${getUrgencyStyle(message.analysis.urgencyLevel).text}`}
                            style={{ fontWeight: 500 }}
                          >
                            🩺 {message.analysis.specialty}
                          </span>
                          <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-600">
                            {Math.round(message.analysis.confidence * 100)}% confidence
                          </span>
                        </div>

                        {/* ── A2A Collaboration Simulation ────────────────── */}
                        {message.analysis.urgencyLevel === "high" && (
                          <div className="mt-4 pt-4 border-t border-red-200">
                            <p className="text-[10px] text-red-600 font-bold uppercase mb-2 flex items-center gap-1">
                              <Zap className="w-3 h-3" /> A2A Collaboration Enabled
                            </p>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => {
                                  setMessages(prev => [...prev, {
                                    id: 'a2a-' + Date.now(),
                                    type: 'ai',
                                    text: `🔄 **A2A HANDOVER: Booking Agent Joined**\n\nI've shared your FHIR Diagnostic Summary with the hospital booking agent. They are now checking available slots for a ${message.analysis.specialty} in your area.`
                                  }]);
                                }}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] h-9 rounded-xl font-bold shadow-md"
                              >
                                🤝 Book Slot
                              </Button>
                              <Button 
                                onClick={() => {
                                  setMessages(prev => [...prev, {
                                    id: 'pharmacy-' + Date.now(),
                                    type: 'ai',
                                    text: `🔄 **A2A HANDOVER: Pharmacy Agent Joined**\n\nPrescription received. I am checking availability at pharmacies near your location...\n\n✅ **Stock Found:** Medicare Pharma (1.2km away) has all items. Would you like to reserve?`
                                  }]);
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[10px] h-9 rounded-xl font-bold shadow-md"
                              >
                                💊 Send to Pharmacy
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Prescription Button ───────────────────────────── */}
                  {message.analysis && (
                    <div className="mt-3">
                      <Button
                        onClick={() => setShowPrescription({
                          patient: {
                            name: "Demo User",
                            gender: userVitals.gender,
                            age: "28",
                            vitals: `${userVitals.height}cm / ${userVitals.weight}kg`
                          },
                          doctor: {
                            name: message.matchingDoctors?.[0]?.name || "Dr. AI Assistant",
                            specialty: message.analysis.specialty,
                            reg: "REG-2026-X99"
                          },
                          analysis: message.analysis
                        })}
                        className="w-full bg-[#e8f4fd] hover:bg-[#d1e9fb] text-[#0A66C2] text-xs h-10 rounded-xl flex items-center justify-center gap-2 border border-[#0A66C2]/20"
                      >
                        <FileText className="w-4 h-4" />
                        Generate Digital Prescription
                      </Button>
                    </div>
                  )}

                  {/* ── Matching Doctors ─────────────────────────────── */}
                  {message.matchingDoctors && message.matchingDoctors.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-500 px-1" style={{ fontWeight: 600 }}>
                        Available {message.analysis?.specialty || "Specialist"}s:
                      </p>
                      {message.matchingDoctors.map((doc: any) => (
                        <motion.div
                          key={doc._id}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Link
                            to={`/booking/${doc._id}`}
                            className="block bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:border-[#0A66C2] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={doc.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(doc.name)}
                                alt={doc.name}
                                className="w-12 h-12 rounded-xl object-cover border border-[#e8f4fd]"
                              />
                              <div className="flex-1">
                                <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                                  {doc.name}
                                </p>
                                <p className="text-xs text-[#0A66C2]">{doc.specialty}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  <span className="text-xs text-gray-600">{doc.rating}</span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">{doc.experience}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-[#0A66C2]" style={{ fontWeight: 600 }}>
                                  ₹{doc.consultationFee?.video || 599}
                                </p>
                                <p className="text-xs text-gray-400">Video</p>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Find Doctor CTA after analysis */}
                  {message.analysis && (
                    <Link
                      to={`/doctors?specialty=${encodeURIComponent(message.analysis.specialty)}`}
                      className="block mt-3"
                    >
                      <Button className="w-full bg-[#0A66C2] hover:bg-[#084a8f] text-white rounded-xl h-12 shadow-sm flex items-center justify-center gap-2">
                        🩺 Find {message.analysis.specialty} Now
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#0A66C2] text-white p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[85%]">
                {message.image && (
                  <img src={message.image} className="w-full max-w-[200px] rounded-lg mb-2 border border-white/20" alt="Symptom" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* ── Voice Active Overlay ──────────────────────────────────────────── */}
      {isListening && (
        <div className="fixed inset-0 z-40 flex items-end ">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={stopListening} />
          <div className="relative w-full bg-white rounded-t-3xl p-8 pb-12 shadow-2xl">
            <div className="text-center">
              {/* Pulsing mic animation */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-[#0A66C2]/20 rounded-full animate-ping" />
                <div className="absolute inset-2 bg-[#0A66C2]/30 rounded-full animate-pulse" />
                <div className="absolute inset-4 bg-gradient-to-br from-[#0A66C2] to-[#084a8f] rounded-full flex items-center justify-center shadow-lg">
                  <Mic className="w-8 h-8 text-white" />
                </div>
              </div>

              <p className="text-lg text-gray-900 mb-2" style={{ fontWeight: 600 }}>
                Listening in {selectedLang.label}...
              </p>

              {transcript && (
                <p className="text-sm text-gray-600 bg-gray-100 rounded-xl px-4 py-3 mb-4 italic">
                  "{transcript}"
                </p>
              )}

              {inputText && (
                <div className="text-left bg-[#e8f4fd] rounded-xl px-4 py-3 mb-4">
                  <p className="text-xs text-[#0A66C2] mb-1" style={{ fontWeight: 600 }}>Captured:</p>
                  <p className="text-sm text-gray-800">{inputText}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={stopListening}
                  className="flex-1 py-3 bg-gray-200 rounded-xl text-gray-700 text-sm hover:bg-gray-300 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Stop Listening
                </button>
                <button
                  onClick={() => {
                    stopListening();
                    handleSend();
                  }}
                  className="flex-1 py-3 bg-[#0A66C2] rounded-xl text-white text-sm hover:bg-[#084a8f] transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Send & Analyze
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Input Area ────────────────────────────────────────────────────── */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 md:left-64 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-2 md:px-4 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-30"
      >
        <div className="max-w-4xl mx-auto flex gap-2 md:gap-3 items-center">
          {/* Voice Button */}
          <div className="relative group">
            <button
              onClick={toggleVoice}
              disabled={!voiceSupported}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                isListening 
                  ? "bg-red-500 text-white animate-pulse" 
                  : "bg-[#e8f4fd] text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white"
              } ${!voiceSupported ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            {isListening && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-xl"
              >
                ● Listening in {selectedLang.label}...
              </motion.div>
            )}
          </div>

          {/* Image Input 1 */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleImageSelect(e, 1)}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${selectedImage ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Progress Mode Toggle */}
          <button
            onClick={() => setIsProgressMode(!isProgressMode)}
            className={`px-3 h-12 rounded-2xl flex items-center gap-2 transition-all ${isProgressMode ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-gray-100 text-gray-500'}`}
          >
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">{isProgressMode ? 'Comparison ON' : 'Track Healing'}</span>
          </button>

          {isProgressMode && (
            <>
              <input
                type="file"
                id="file2"
                onChange={(e) => handleImageSelect(e, 2)}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => document.getElementById('file2')?.click()}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${secondImage ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Text Input */}
          <div className="flex-1 relative">
            {imagePreview && (
              <div className="absolute -top-24 left-0 bg-white p-2 rounded-xl shadow-xl border border-gray-100 flex items-center gap-2">
                <img src={imagePreview} className="w-16 h-16 object-cover rounded-lg" alt="Preview" />
                <button onClick={removeImage} className="p-1 bg-red-100 text-red-600 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Describe symptoms in ${selectedLang.label}...`}
              className="w-full px-5 py-4 bg-[#f8f9fb] rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent text-sm"
              disabled={isProcessing}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && !selectedImage) || isProcessing}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              inputText.trim() || selectedImage
                ? "bg-[#0A66C2] hover:bg-[#084a8f] shadow-md"
                : "bg-[#e8f4fd]"
            }`}
          >
            <Send
              className={`w-5 h-5 ${inputText.trim() ? "text-white" : "text-[#0A66C2]"}`}
            />
          </button>
        </div>
        <p className="text-center text-xs text-gray-500 mt-3">
          🎤 Tap mic to speak in {selectedLang.label} · Powered by AI
        </p>
      </motion.div>

      {/* ── Digital Prescription Modal (Official Paper Design) ──────────────── */}
      <AnimatePresence>
        {showPrescription && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="relative w-full max-w-[800px] my-8 print:my-0"
            >
              {/* Close Button (Hidden on Print) */}
              <button 
                onClick={() => setShowPrescription(null)}
                className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white transition-colors print:hidden flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                <span className="text-sm font-medium">Close Preview</span>
              </button>

              {/* The "Paper" */}
              <div 
                id="prescription-paper"
                className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] min-h-[1000px] p-12 relative overflow-hidden print:shadow-none print:p-8"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {/* Official Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-35deg] select-none">
                  <h1 className="text-[120px] font-black tracking-tighter">MEDICARE</h1>
                </div>

                {/* Hospital Header */}
                <div className="flex justify-between items-start border-b-4 border-[#0A66C2] pb-6 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#0A66C2] rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-black text-3xl">M</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">MEDICARE AI</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Smart Triage & Consultations</p>
                      <p className="text-[9px] text-gray-400 mt-1 max-w-[200px]">Electronic Health Record System · Verified AI Diagnostic Assistant</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm font-bold text-gray-900">{showPrescription.doctor.name}</h4>
                    <p className="text-[10px] text-[#0A66C2] font-bold uppercase">{showPrescription.doctor.specialty}</p>
                    <p className="text-[9px] text-gray-400 mt-1">Registration No: {showPrescription.doctor.reg}</p>
                    <p className="text-[9px] text-gray-400">Digital ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                  </div>
                </div>

                {/* Patient Case Details */}
                <div className="grid grid-cols-4 gap-4 mb-10 text-[11px] bg-gray-50 border border-gray-100 rounded-xl p-5">
                  <div className="col-span-2 border-r border-gray-200 pr-4">
                    <p className="text-gray-400 font-bold uppercase mb-1 tracking-wider">Patient Name</p>
                    <p className="text-sm font-bold text-gray-900">{showPrescription.patient.name}</p>
                  </div>
                  <div className="border-r border-gray-200 px-4">
                    <p className="text-gray-400 font-bold uppercase mb-1 tracking-wider">Gender / Age</p>
                    <p className="text-sm font-bold text-gray-900">{showPrescription.patient.gender} / {showPrescription.patient.age}</p>
                  </div>
                  <div className="pl-4 text-right">
                    <p className="text-gray-400 font-bold uppercase mb-1 tracking-wider">Date</p>
                    <p className="text-sm font-bold text-gray-900">{new Date().toLocaleDateString('en-GB')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-12 text-[11px]">
                  <div className="col-span-1">
                    <p className="text-gray-400 font-bold uppercase mb-1 tracking-wider">Vitals (H/W)</p>
                    <p className="text-sm font-bold text-gray-900">{showPrescription.patient.vitals}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-gray-400 font-bold uppercase mb-1 tracking-wider">Case Reference ID</p>
                    <p className="text-sm font-mono font-bold text-gray-900 tracking-tighter">DUCK-FHIR-2026-{Math.floor(1000 + Math.random() * 9000)}</p>
                  </div>
                </div>

                {/* The Rx Content */}
                <div className="flex gap-8 min-h-[400px]">
                  {/* Left Column: Clinical Notes */}
                  <div className="w-1/3 border-r border-gray-100 pr-6">
                    <div className="mb-8">
                      <h5 className="text-[10px] font-black text-gray-900 uppercase border-b border-gray-900 pb-1 mb-3">Symptoms Extract</h5>
                      <div className="space-y-1">
                        {showPrescription.analysis.matchedSymptoms?.map((s: string, i: number) => (
                          <p key={i} className="text-[11px] text-gray-600 flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-gray-400 rounded-full" /> {s}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="mb-8">
                      <h5 className="text-[10px] font-black text-gray-900 uppercase border-b border-gray-900 pb-1 mb-3">Triage Urgency</h5>
                      <div className="flex items-center gap-2">
                         <div className={`w-3 h-3 rounded-full ${showPrescription.analysis.urgencyLevel === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                         <span className="text-xs font-bold text-gray-900 uppercase">{showPrescription.analysis.urgencyLevel}</span>
                         <span className="text-[10px] text-gray-400">Score: {showPrescription.analysis.urgencyScore}/10</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Recommendations */}
                  <div className="flex-1 relative">
                    <div className="text-5xl font-serif text-gray-900 mb-6 italic select-none">Rx</div>
                    
                    <div className="mb-8">
                      <h5 className="text-[11px] font-black text-[#0A66C2] uppercase mb-3">Clinical Impression & Advice</h5>
                      <p className="text-[13px] text-gray-800 leading-relaxed font-medium mb-4">
                        {showPrescription.analysis.clinicalReasoning}
                      </p>
                    </div>

                    <div className="mb-10 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                      <h5 className="text-[11px] font-black text-[#0A66C2] uppercase mb-3">Doctor Consultation Advice</h5>
                      <p className="text-sm font-bold text-gray-900 mb-3 underline decoration-[#0A66C2]/30 decoration-2 underline-offset-4">
                        Consult a {showPrescription.doctor.specialty} immediately.
                      </p>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Follow-up Queries:</p>
                        <ul className="space-y-1.5">
                          {showPrescription.analysis.followUpQuestions.map((q: string, i: number) => (
                            <li key={i} className="text-[12px] text-gray-700 leading-tight flex gap-2">
                              <span className="text-[#0A66C2]">•</span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer / Signature */}
                <div className="mt-12 flex justify-between items-end border-t border-gray-200 pt-8">
                  <div>
                    <p className="text-[9px] text-gray-400 max-w-[300px]">
                      This is an AI-generated digital triage slip. It is intended for preliminary advice and must be verified by a registered medical practitioner before starting any medication.
                    </p>
                    <div className="mt-4 flex items-center gap-2 opacity-30 grayscale">
                       <Activity className="w-4 h-4" />
                       <span className="text-[10px] font-black tracking-tighter">MEDICARE CLOUD v1.1</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mb-2">
                      <p className="text-[13px] font-serif italic text-gray-900 leading-none">{showPrescription.doctor.name}</p>
                      <p className="text-[8px] text-gray-400 uppercase font-bold mt-1 tracking-widest">Digital Signature Hash: {Math.random().toString(16).substr(2, 12)}</p>
                    </div>
                    <div className="w-48 h-0.5 bg-gray-900 mx-auto" />
                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-2">Verified Medical Specialist</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Hidden on Print) */}
              <div className="mt-6 flex gap-4 print:hidden">
                <Button 
                  onClick={() => window.print()}
                  className="flex-1 bg-[#0A66C2] hover:bg-[#084a8f] text-white rounded-2xl py-7 text-sm font-bold shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Print Official Document (PDF)
                </Button>
                <Button 
                  onClick={() => setShowPrescription(null)}
                  variant="outline"
                  className="px-10 rounded-2xl border-white/20 text-white hover:bg-white/10 backdrop-blur-md font-bold"
                >
                  Discard
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
}
