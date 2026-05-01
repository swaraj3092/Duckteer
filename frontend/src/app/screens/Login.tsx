import { useState } from "react";
import { useNavigate } from "react-router";
import { Phone, Mail, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { API_BASE_URL } from "../api";

export function Login() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    if (phoneNumber.length === 10) {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneNumber }),
        });
        const data = await res.json();
        if (res.ok) {
          navigate("/verify-otp", { state: { phoneNumber } });
        } else {
          alert(data.message || "Failed to send OTP");
        }
      } catch (err) {
        console.error(err);
        alert("An error occurred while sending OTP");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@gmail.com", name: "Demo User" }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } else {
        alert(data.message || "Failed to login with Google");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during Google login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A66C2] via-[#084a8f] to-[#0A66C2] flex flex-col  relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-32 -translate-x-32" />
      
      <div className="relative z-10 flex flex-col flex-1 px-6 py-12">
        {/* Logo & Header */}
        <div className="text-center mb-12 mt-8">
          <div className="w-20 h-20 bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0A66C2] to-[#084a8f] rounded-2xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl text-white mb-3" style={{ fontWeight: 600 }}>
            Welcome to MediConnect
          </h1>
          <p className="text-white/80 text-base">
            Connect with super-specialists from anywhere
          </p>
          <p className="text-white/60 text-sm mt-2">
            🏥 Tier 2 & 3 Cities Healthcare Partner
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-md border border-white/20">
          {/* Mobile Number Input */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-3 text-sm" style={{ fontWeight: 600 }}>
              Mobile Number
            </label>
            <div className="flex items-center gap-3 bg-[#f8f9fb] rounded-2xl px-5 py-4 border-2 border-gray-200 focus-within:border-[#0A66C2] transition-colors">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600" style={{ fontWeight: 500 }}>+91</span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Enter 10-digit mobile number"
                className="flex-1 bg-transparent outline-none text-gray-900"
                maxLength={10}
              />
            </div>
            {phoneNumber.length > 0 && phoneNumber.length < 10 && (
              <p className="text-xs text-red-500 mt-2 ml-1">
                Please enter a valid 10-digit mobile number
              </p>
            )}
          </div>

          {/* Send OTP Button */}
          <Button
            onClick={handleSendOTP}
            disabled={phoneNumber.length !== 10}
            className="w-full bg-gradient-to-r from-[#0A66C2] to-[#084a8f] hover:from-[#084a8f] hover:to-[#0A66C2] text-white rounded-2xl h-14 text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            Send OTP
          </Button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-[#0A66C2] rounded-2xl h-14 transition-all hover:shadow-md"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-gray-700" style={{ fontWeight: 500 }}>Continue with Google</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 text-center">
          <p className="text-white/70 text-sm mb-3">
            By continuing, you agree to our
          </p>
          <div className="flex items-center justify-center gap-3 text-white text-sm">
            <button className="underline hover:text-white/80">Terms of Service</button>
            <span className="text-white/40">•</span>
            <button className="underline hover:text-white/80">Privacy Policy</button>
          </div>
          
          {/* Demo Quick Access */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-white/50 text-xs mb-2">For demo testing:</p>
            <button
              onClick={async () => {
                setIsLoading(true);
                try {
                  // Attempt to login with our seeded demo phone
                  const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phone: "9876543210", otp: "123456" }), // Default OTP for seeded users in dev
                  });
                  const data = await res.json();
                  if (res.ok) {
                    localStorage.setItem("isAuthenticated", "true");
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));
                    navigate("/");
                  } else {
                    // Fallback to offline mode for UI demo if server is slow
                    localStorage.setItem("isAuthenticated", "true");
                    localStorage.setItem("user", JSON.stringify({ 
                      id: "demo", 
                      name: "Demo Patient", 
                      phone: "9876543210",
                      role: "patient"
                    }));
                    navigate("/");
                  }
                } catch (err) {
                  // Robust fallback
                  localStorage.setItem("isAuthenticated", "true");
                  localStorage.setItem("token", "demo_token_offline");
                  localStorage.setItem("user", JSON.stringify({ id: "demo", name: "Demo User" }));
                  navigate("/");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/90 text-xs transition-colors border border-white/10"
            >
              Skip Login (Demo Mode)
            </button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-around text-white text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="w-px h-4 bg-white/30" />
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>Private</span>
            </div>
            <div className="w-px h-4 bg-white/30" />
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
