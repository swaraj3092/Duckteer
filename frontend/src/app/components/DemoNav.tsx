import { Link, useLocation, useNavigate } from "react-router";
import { Home, Users, Calendar, Video, Briefcase, FileText, LogOut, Zap, Activity, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

export function DemoNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // ── Health Pulse Logic ───────────────────────────────────────────────────
  const height = parseFloat(localStorage.getItem("height") || "0");
  const weight = parseFloat(localStorage.getItem("weight") || "0");
  const bmi = height > 0 ? (weight / ((height / 100) * (height / 100))).toFixed(1) : "N/A";
  
  const getBMICategory = (val: string) => {
    const b = parseFloat(val);
    if (isNaN(b)) return { label: "Unknown", color: "text-blue-200" };
    if (b < 18.5) return { label: "Underweight", color: "text-blue-300" };
    if (b < 25) return { label: "Healthy", color: "text-green-300" };
    if (b < 30) return { label: "Overweight", color: "text-orange-300" };
    return { label: "Obese", color: "text-red-300" };
  };

  const bmiCat = getBMICategory(bmi);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userPhone");
    navigate("/login");
  };

  const navItems = [
    { path: "/", icon: Home, label: "Patient Home" },
    { path: "/doctors", icon: Users, label: "Doctors" },
    { path: "/booking/1", icon: Calendar, label: "Booking" },
    { path: "/video-call/123", icon: Video, label: "Video Call" },
    { path: "/doctor-dashboard", icon: Briefcase, label: "Doctor View" },
    { path: "/doctor/setup", icon: Users, label: "Doctor Setup" },
    { path: "/medical-records", icon: FileText, label: "Records" },
  ];

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[60] w-10 h-10 bg-[#084a8f] text-white rounded-full flex items-center justify-center shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {(isOpen) && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed top-0 left-0 bottom-0 w-64 z-50 bg-[#084a8f] text-white shadow-xl flex flex-col md:hidden"
          >
            {/* Mobile Header with Close Button */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-[#084a8f] font-bold text-xl">M</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">MediConnect</h2>
                  <p className="text-xs text-blue-200">AI Health Dashboard</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/60 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
              <NavContent location={location} navItems={navItems} setIsOpen={setIsOpen} />
            </div>

            <div className="px-4 mb-4">
              <HealthPulse bmi={bmi} bmiCat={bmiCat} />
            </div>

            <div className="p-4 border-t border-white/10">
              <LogoutButton handleLogout={handleLogout} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Always Visible) */}
      <div className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 z-50 bg-[#084a8f] text-white shadow-xl flex-col">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <span className="text-[#084a8f] font-bold text-xl">M</span>
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">MediConnect</h2>
            <p className="text-xs text-blue-200">AI Health Dashboard</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          <NavContent location={location} navItems={navItems} />
        </div>

        <div className="px-4 mb-4">
          <HealthPulse bmi={bmi} bmiCat={bmiCat} />
        </div>

        <div className="p-4 border-t border-white/10">
          <LogoutButton handleLogout={handleLogout} />
        </div>
      </div>
    </>
  );
}

// ── Helper Components ────────────────────────────────────────────────────────

const NavContent = ({ location, navItems, setIsOpen }: { location: any, navItems: any[], setIsOpen?: (o: boolean) => void }) => (
  <>
    <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2 px-2">Navigation</p>
    {navItems.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.path;
      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => setIsOpen?.(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive
              ? "bg-white text-[#0A66C2] shadow-md"
              : "text-white/80 hover:bg-white/10"
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className="font-medium text-sm">{item.label}</span>
        </Link>
      );
    })}
  </>
);

const HealthPulse = ({ bmi, bmiCat }: { bmi: string, bmiCat: any }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg"
  >
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Health Pulse</h3>
      <Activity className="w-3 h-3 text-green-400 animate-pulse" />
    </div>

    <div className="flex items-end gap-2 mb-2">
      <span className="text-2xl font-black text-white">{bmi}</span>
      <span className="text-[9px] text-blue-200 mb-1">BMI</span>
    </div>

    <div className="space-y-2">
      <div className="flex justify-between items-center text-[9px]">
        <span className="text-blue-100/60">Status</span>
        <span className={`font-bold ${bmiCat.color}`}>{bmiCat.label}</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: bmi !== "N/A" ? `${Math.min(parseFloat(bmi) * 3, 100)}%` : 0 }}
          className="h-full bg-blue-400 rounded-full"
        />
      </div>
    </div>

    <div className="mt-3 pt-3 border-t border-white/5">
      <p className="text-[8px] text-blue-100/70 leading-tight italic">
        "AI: Vitals look stable. Target 2.5L hydration today."
      </p>
    </div>
  </motion.div>
);

const LogoutButton = ({ handleLogout }: { handleLogout: () => void }) => (
  <button
    onClick={handleLogout}
    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-red-500/20 text-red-200 hover:bg-red-500 hover:text-white transition-all text-sm font-medium"
  >
    <LogOut className="w-4 h-4" />
    <span>Logout</span>
  </button>
);
