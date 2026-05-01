import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { ArrowLeft, Shield, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { API_BASE_URL } from "../api";

export function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumber = location.state?.phoneNumber || "9876543210";
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length === 6) {
      setIsVerifying(true);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneNumber, otp: otpValue }),
        });
        const data = await res.json();
        if (res.ok) {
          setIsSuccess(true);
          // Save auth state
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          
          // Navigate after success animation
          setTimeout(() => {
            navigate("/");
          }, 1500);
        } else {
          alert(data.message || "Invalid OTP");
        }
      } catch (err) {
        console.error(err);
        alert("An error occurred during verification");
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleResend = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        setTimer(30);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        document.getElementById("otp-0")?.focus();
        alert("OTP sent successfully!");
      } else {
        alert(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while resending OTP");
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A66C2] via-[#084a8f] to-[#0A66C2] flex flex-col  relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-32 -translate-x-32" />
      
      <div className="relative z-10 flex flex-col flex-1 px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/login")}
            className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl text-white" style={{ fontWeight: 600 }}>
            Verify OTP
          </h1>
        </div>

        {/* Success Animation */}
        {isSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0A66C2]/95 backdrop-blur-md">
            <div className="text-center">
              <div className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-scale-in shadow-2xl">
                <CheckCircle className="w-14 h-14 text-white" />
              </div>
              <p className="text-white text-2xl" style={{ fontWeight: 600 }}>Verified!</p>
              <p className="text-white/70 text-sm mt-2">Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        {/* OTP Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-md border border-white/20">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-[#e8f4fd] to-[#0A66C2]/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Shield className="w-8 h-8 text-[#0A66C2]" />
          </div>

          {/* Description */}
          <div className="text-center mb-8">
            <h2 className="text-xl text-gray-900 mb-2" style={{ fontWeight: 600 }}>
              Enter Verification Code
            </h2>
            <p className="text-gray-600 text-sm">
              We've sent a 6-digit code to
            </p>
            <p className="text-[#0A66C2] text-base mt-1" style={{ fontWeight: 600 }}>
              +91 {phoneNumber}
            </p>
          </div>

          {/* OTP Input */}
          <div className="flex gap-3 justify-center mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="tel"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl bg-[#f8f9fb] border-2 border-gray-200 rounded-xl focus:border-[#0A66C2] focus:outline-none transition-colors"
                style={{ fontWeight: 600 }}
              />
            ))}
          </div>

          {/* Timer / Resend */}
          <div className="text-center mb-6">
            {!canResend ? (
              <p className="text-gray-500 text-sm">
                Resend code in <span className="text-[#0A66C2]" style={{ fontWeight: 600 }}>{timer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-[#0A66C2] text-sm hover:underline"
                style={{ fontWeight: 600 }}
              >
                Resend OTP
              </button>
            )}
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={!isOtpComplete || isVerifying}
            className="w-full bg-gradient-to-r from-[#0A66C2] to-[#084a8f] hover:from-[#084a8f] hover:to-[#0A66C2] text-white rounded-2xl h-14 text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying...</span>
              </div>
            ) : (
              "Verify & Continue"
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-white/70 text-sm mb-3">
            Didn't receive the code?
          </p>
          <div className="flex items-center justify-center gap-3 text-white text-sm">
            <button className="underline hover:text-white/80">Change Number</button>
            <span className="text-white/40">•</span>
            <button className="underline hover:text-white/80">Need Help?</button>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-auto pt-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center justify-center gap-2 text-white text-sm">
            <Shield className="w-4 h-4" />
            <span>Your data is secure and encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
