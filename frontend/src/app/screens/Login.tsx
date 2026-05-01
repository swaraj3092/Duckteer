import { useState } from "react";
import { useNavigate } from "react-router";
import { Phone, Lock, User, Eye, EyeOff, Shield, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { API_BASE_URL } from "../api";

type Mode = "login" | "signup" | "forgot" | "reset";

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const saveAndNavigate = (data: any) => {
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    navigate("/");
  };

  const handleLogin = async () => {
    setError("");
    if (!phone || !password) return setError("Phone and password are required.");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (res.ok) {
        saveAndNavigate(data);
      } else if (data.code === 'USER_NOT_FOUND') {
        // Automatically switch to signup mode
        setMode("signup");
        setPhone(phone); // Keep the phone number filled
        setError("Account not found. Please sign up first.");
        setSuccess("");
      } else {
        setError(data.message || "Login failed.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setError("");
    if (!name || !phone || !password) return setError("All fields are required.");
    if (phone.length !== 10) return setError("Enter a valid 10-digit phone number.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, password }),
      });
      const data = await res.json();
      if (res.ok) {
        saveAndNavigate(data);
      } else {
        setError(data.message || "Signup failed.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(""); setSuccess("");
    if (!phone) return setError("Enter your phone number.");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Reset code sent! Check your phone (or console in dev mode).");
        setTimeout(() => setMode("reset"), 1500);
      } else {
        setError(data.message || "Failed.");
      }
    } catch {
      setError("Connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(""); setSuccess("");
    if (!phone || !resetCode || !newPassword) return setError("All fields are required.");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, resetToken: resetCode, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        saveAndNavigate(data);
      } else {
        setError(data.message || "Reset failed.");
      }
    } catch {
      setError("Connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "9876543210", password: "Demo1234" }),
      });
      const data = await res.json();
      if (res.ok) {
        saveAndNavigate(data);
      } else {
        // Fallback offline mode
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("token", "demo_token_offline");
        localStorage.setItem("user", JSON.stringify({ id: "demo", name: "Demo User", phone: "9876543210", role: "patient" }));
        navigate("/");
      }
    } catch {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("token", "demo_token_offline");
      localStorage.setItem("user", JSON.stringify({ id: "demo", name: "Demo User" }));
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const title = { login: "Welcome Back", signup: "Create Account", forgot: "Reset Password", reset: "Set New Password" };
  const subtitle = {
    login: "Login with your phone & password",
    signup: "Sign up for free — no credit card needed",
    forgot: "Enter your phone to receive a reset code",
    reset: "Enter the code sent to your phone",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A66C2] via-[#084a8f] to-[#0A66C2] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-32 -translate-x-32" />

      <div className="relative z-10 flex flex-col flex-1 px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-8 mt-4">
          <div className="w-20 h-20 bg-white rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-2xl overflow-hidden p-2">
            <img src="/favicon.png" alt="Duckteer Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl text-white mb-1" style={{ fontWeight: 800 }}>Duckteer</h1>
          <p className="text-white/60 text-sm">🏥 Tier 2 & 3 Cities Healthcare Partner</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-7">
          {/* Back button for sub-modes */}
          {mode !== "login" && (
            <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#0A66C2]">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
          )}

          <h2 className="text-xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>{title[mode]}</h2>
          <p className="text-gray-500 text-sm mb-5">{subtitle[mode]}</p>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{success}</div>}

          <div className="space-y-4">
            {/* Name (signup only) */}
            {mode === "signup" && (
              <div className="flex items-center gap-3 bg-[#f8f9fb] rounded-2xl px-4 py-3.5 border-2 border-gray-200 focus-within:border-[#0A66C2] transition-colors">
                <User className="w-5 h-5 text-gray-400" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="flex-1 bg-transparent outline-none text-gray-900 text-sm" />
              </div>
            )}

            {/* Phone */}
            {(mode === "login" || mode === "signup" || mode === "forgot" || mode === "reset") && (
              <div className="flex items-center gap-3 bg-[#f8f9fb] rounded-2xl px-4 py-3.5 border-2 border-gray-200 focus-within:border-[#0A66C2] transition-colors">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500 text-sm">+91</span>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" className="flex-1 bg-transparent outline-none text-gray-900 text-sm" />
              </div>
            )}

            {/* Password (login & signup) */}
            {(mode === "login" || mode === "signup") && (
              <div className="flex items-center gap-3 bg-[#f8f9fb] rounded-2xl px-4 py-3.5 border-2 border-gray-200 focus-within:border-[#0A66C2] transition-colors">
                <Lock className="w-5 h-5 text-gray-400" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "signup" ? "Create password (min 6 chars)" : "Your password"} className="flex-1 bg-transparent outline-none text-gray-900 text-sm" />
                <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Reset Code */}
            {mode === "reset" && (
              <>
                <div className="flex items-center gap-3 bg-[#f8f9fb] rounded-2xl px-4 py-3.5 border-2 border-gray-200 focus-within:border-[#0A66C2] transition-colors">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <input type="text" value={resetCode} onChange={e => setResetCode(e.target.value)} placeholder="6-digit reset code" className="flex-1 bg-transparent outline-none text-gray-900 text-sm" maxLength={6} />
                </div>
                <div className="flex items-center gap-3 bg-[#f8f9fb] rounded-2xl px-4 py-3.5 border-2 border-gray-200 focus-within:border-[#0A66C2] transition-colors">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" className="flex-1 bg-transparent outline-none text-gray-900 text-sm" />
                  <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}

            {/* Forgot password link */}
            {mode === "login" && (
              <div className="text-right">
                <button onClick={() => { setMode("forgot"); setError(""); }} className="text-sm text-[#0A66C2] hover:underline">Forgot Password?</button>
              </div>
            )}

            {/* Main CTA */}
            <Button
              onClick={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : mode === "forgot" ? handleForgotPassword : handleResetPassword}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#0A66C2] to-[#084a8f] text-white rounded-2xl h-13 text-base shadow-lg disabled:opacity-50 py-3.5"
            >
              {isLoading ? "Please wait..." : mode === "login" ? "Login" : mode === "signup" ? "Create Account" : mode === "forgot" ? "Send Reset Code" : "Set New Password"}
            </Button>

            {/* Toggle between login / signup */}
            {(mode === "login" || mode === "signup") && (
              <p className="text-center text-sm text-gray-500">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} className="text-[#0A66C2] font-semibold hover:underline">
                  {mode === "login" ? "Sign Up" : "Login"}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Demo quick access */}
        <div className="mt-6 text-center">
          <p className="text-white/50 text-xs mb-2">Hackathon demo access:</p>
          <button onClick={handleDemoLogin} disabled={isLoading} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/90 text-xs transition-colors border border-white/10 disabled:opacity-50">
            {isLoading ? "Loading..." : "Skip Login (Demo Mode)"}
          </button>
        </div>
      </div>
    </div>
  );
}
