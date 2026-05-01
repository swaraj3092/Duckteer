import { Link } from "react-router";
import { Clock, AlertCircle, CheckCircle, Calendar, TrendingUp, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { DemoNav } from "../components/DemoNav";
import { API_BASE_URL } from "../api";

// Hardcoded types for now
type Appointment = {
  _id: string;
  patient: {
    name: string;
    age: number;
    gender: string;
    patientId: string;
  };
  time: string;
  symptoms: string;
  amount: number;
  status: string;
};

import { useState, useEffect } from "react";

export function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ totalAppointments: 0, completed: 0, pending: 0, revenue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Basic mock profile until the real /api/auth/me is fetched
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");
        
        const res = await fetch(`${API_BASE_URL}/appointments`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch");
        
        setAppointments(data.appointments || []);
        
        // Calculate basic stats
        const apps = data.appointments || [];
        const completed = apps.filter((a: any) => a.status === 'completed').length;
        const pending = apps.filter((a: any) => a.status !== 'completed' && a.status !== 'cancelled').length;
        const revenue = apps.reduce((sum: number, a: any) => sum + (a.amount || 0), 0);
        
        setStats({
          totalAppointments: apps.length,
          completed,
          pending,
          revenue
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppointments();
  }, []);

  const getUrgencyColor = () => {
    // For demo: everything is normal unless specified in future real AI data
    return {
      bg: "bg-blue-50",
      text: "text-blue-700",
      badge: "bg-blue-500",
      border: "border-blue-200",
    };
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <DemoNav />
      <div className="flex-1 ml-64 flex flex-col relative pb-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#084a8f] px-6 pt-28 pb-8 text-white rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/80 text-sm">Welcome back,</p>
            <h1 className="text-2xl mt-1" style={{ fontWeight: 600 }}>Dr. {user.name || "Specialist"}</h1>
            <p className="text-white/70 text-sm mt-1">Doctor Dashboard</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <img 
              src="https://images.unsplash.com/photo-1659353887804-fc7f9313021a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBkb2N0b3IlMjBwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzQ2MTAyNjN8MA&ixlib=rb-4.1.0&q=80&w=200"
              alt="Doctor"
              className="w-full h-full rounded-2xl object-cover"
            />
          </div>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center">
            <p className="text-2xl mb-1" style={{ fontWeight: 600 }}>{stats.totalAppointments}</p>
            <p className="text-white/80 text-xs">Total</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center">
            <p className="text-2xl mb-1" style={{ fontWeight: 600 }}>{stats.completed}</p>
            <p className="text-white/80 text-xs">Done</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center">
            <p className="text-2xl mb-1" style={{ fontWeight: 600 }}>{stats.pending}</p>
            <p className="text-white/80 text-xs">Pending</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center">
            <p className="text-lg mb-1" style={{ fontWeight: 600 }}>₹{stats.revenue}</p>
            <p className="text-white/80 text-xs">Revenue</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 -mt-8 mb-6">
        <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
          <div className="grid grid-cols-3 gap-3">
            <button className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#e8f4fd] transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#e8f4fd] flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#0A66C2]" />
              </div>
              <span className="text-xs text-gray-700">Schedule</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#e8f4fd] transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#e8f4fd] flex items-center justify-center">
                <Users className="w-6 h-6 text-[#0A66C2]" />
              </div>
              <span className="text-xs text-gray-700">Patients</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#e8f4fd] transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#e8f4fd] flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#0A66C2]" />
              </div>
              <span className="text-xs text-gray-700">Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl text-gray-900" style={{ fontWeight: 600 }}>Today's Appointments</h2>
          <span className="text-sm text-[#0A66C2]" style={{ fontWeight: 500 }}>Friday, Mar 27</span>
        </div>

        <div className="space-y-4">
          {isLoading && <p className="text-center text-gray-500 py-6">Loading appointments...</p>}
          {error && <p className="text-center text-red-500 py-6">{error}</p>}
          
          {!isLoading && appointments.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
               <p className="text-gray-500" style={{ fontWeight: 500 }}>No appointments yet.</p>
               <p className="text-xs text-gray-400 mt-1">Wait for patients to book with you.</p>
            </div>
          )}

          {!isLoading && appointments.map((appointment) => {
            const colors = getUrgencyColor();
            return (
              <div
                key={appointment._id}
                className={`bg-white rounded-2xl shadow-md overflow-hidden border ${colors.border}`}
              >
                {/* Status Badge */}
                <div className={`${colors.bg} px-4 py-2 flex items-center justify-between border-b ${colors.border}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${colors.badge} rounded-full`} />
                    <span className={`text-xs ${colors.text}`} style={{ fontWeight: 600 }}>
                      {appointment.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{appointment.time || "Scheduled"}</span>
                  </div>
                </div>

                <div className="p-4">
                  {/* Patient Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-gray-900" style={{ fontWeight: 600 }}>
                         {appointment.patient?.name || "Unknown Patient"}
                      </h3>
                      <p className="text-sm text-gray-500">
                         {appointment.patient?.age || "?"} years • {appointment.patient?.gender || "Not specified"}
                      </p>
                      <p className="text-xs text-[#0A66C2] mt-1">{appointment.patient?.patientId}</p>
                    </div>
                    <span className="text-xs px-3 py-1 bg-[#e8f4fd] text-[#0A66C2] rounded-full" style={{ fontWeight: 500 }}>
                      30 min
                    </span>
                  </div>

                  {/* AI Symptom Analysis */}
                  <div className={`${colors.bg} rounded-xl p-3 mb-4 border ${colors.border}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className={`w-4 h-4 ${colors.text}`} />
                      <span className={`text-xs ${colors.text}`} style={{ fontWeight: 600 }}>Symptom Notes</span>
                    </div>
                    <p className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{appointment.symptoms || "No specific symptoms provided"}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link to={`/video-call/${appointment._id}`} className="flex-1">
                      <Button className="w-full bg-[#0A66C2] hover:bg-[#084a8f] text-white rounded-xl h-10 text-sm disabled:opacity-50">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Enter Room
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        <button className="w-full mt-4 py-3 text-[#0A66C2] text-sm hover:bg-[#e8f4fd] rounded-xl transition-colors" style={{ fontWeight: 500 }}>
          View All Appointments →
        </button>
      </div>
      </div>
    </div>
  );
}
