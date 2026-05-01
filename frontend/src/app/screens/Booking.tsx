import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Video, MessageSquare, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { DemoNav } from "../components/DemoNav";

import { API_BASE_URL } from "../api";

// Helpers to get next 7 days in YYYY-MM-DD format and for display
const getNext7Days = () => {
  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    result.push({
      fullDate: `${yyyy}-${mm}-${dd}`,
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
      isToday: i === 0,
    });
  }
  return result;
};

const dates = getNext7Days();

export function Booking() {
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const [selectedDateObj, setSelectedDateObj] = useState(dates[0]);
  const [selectedTime, setSelectedTime] = useState("");
  const [consultType, setConsultType] = useState<"video" | "chat">("video");

  const [doctorName, setDoctorName] = useState("Loading...");
  const [timeSlots, setTimeSlots] = useState<{ morning: string[], afternoon: string[], evening: string[] }>({
    morning: [],
    afternoon: [],
    evening: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!doctorId) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/slots?date=${selectedDateObj.fullDate}`);
        const data = await res.json();
        if (res.ok) {
          setTimeSlots(data.slots || { morning: [], afternoon: [], evening: [] });
          setDoctorName(data.doctorName || "Unknown Doctor");
        } else {
          console.error("Failed to fetch slots:", data.message);
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [doctorId, selectedDateObj.fullDate]);

  const handleConfirm = () => {
    navigate("/video-call/123");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <DemoNav />
      <div className="flex-1 md:ml-64 flex flex-col relative pb-24">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#084a8f] px-4 md:px-6 pt-16 md:pt-28 pb-6 text-white rounded-b-[2rem] shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/doctors" className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl" style={{ fontWeight: 600 }}>Book Appointment</h1>
            <p className="text-white/80 text-sm mt-1">{doctorName}</p>
          </div>
        </div>
      </div>

      {/* Booking Content */}
      <div className="flex-1 px-4 py-6 pb-32 overflow-y-auto">
        {/* Select Date */}
        <div className="mb-6">
          <h3 className="text-gray-900 mb-4" style={{ fontWeight: 600 }}>Select Date</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {dates.map((dateObj) => (
              <button
                key={dateObj.fullDate}
                onClick={() => { setSelectedDateObj(dateObj); setSelectedTime(""); }}
                className={`flex-shrink-0 flex flex-col items-center p-4 rounded-2xl min-w-[70px] transition-all ${
                  selectedDateObj.fullDate === dateObj.fullDate
                    ? "bg-[#0A66C2] text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-[#0A66C2]"
                }`}
              >
                <span className={`text-xs mb-1 ${selectedDateObj.fullDate === dateObj.fullDate ? "text-white/80" : "text-gray-500"}`}>
                  {dateObj.day}
                </span>
                <span className="text-2xl mb-1" style={{ fontWeight: 600 }}>{dateObj.date}</span>
                <span className={`text-xs ${selectedDateObj.fullDate === dateObj.fullDate ? "text-white/80" : "text-gray-500"}`}>
                  {dateObj.month}
                </span>
                {dateObj.isToday && (
                  <span className="text-xs mt-1 px-2 py-0.5 bg-green-500 text-white rounded-full">
                    Today
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Consultation Type */}
        <div className="mb-6">
          <h3 className="text-gray-900 mb-4" style={{ fontWeight: 600 }}>Consultation Type</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setConsultType("video")}
              className={`p-4 rounded-2xl border-2 transition-all ${
                consultType === "video"
                  ? "border-[#0A66C2] bg-[#e8f4fd]"
                  : "border-gray-200 bg-white hover:border-[#0A66C2]"
              }`}
            >
              <Video className={`w-6 h-6 mx-auto mb-2 ${consultType === "video" ? "text-[#0A66C2]" : "text-gray-400"}`} />
              <p className={`text-sm ${consultType === "video" ? "text-[#0A66C2]" : "text-gray-700"}`} style={{ fontWeight: 500 }}>
                Video Call
              </p>
              <p className="text-xs text-gray-500 mt-1">₹599</p>
            </button>
            <button
              onClick={() => setConsultType("chat")}
              className={`p-4 rounded-2xl border-2 transition-all ${
                consultType === "chat"
                  ? "border-[#0A66C2] bg-[#e8f4fd]"
                  : "border-gray-200 bg-white hover:border-[#0A66C2]"
              }`}
            >
              <MessageSquare className={`w-6 h-6 mx-auto mb-2 ${consultType === "chat" ? "text-[#0A66C2]" : "text-gray-400"}`} />
              <p className={`text-sm ${consultType === "chat" ? "text-[#0A66C2]" : "text-gray-700"}`} style={{ fontWeight: 500 }}>
                Chat Consult
              </p>
              <p className="text-xs text-gray-500 mt-1">₹399</p>
            </button>
          </div>
        </div>

        {/* Time Slots */}
        <div className="mb-6">
          <h3 className="text-gray-900 mb-4" style={{ fontWeight: 600 }}>Available Time Slots</h3>
          
          {loading ? (
            <div className="text-gray-500 text-center">Loading slots...</div>
          ) : Object.values(timeSlots).every(arr => arr.length === 0) ? (
            <div className="text-gray-500 text-center">No slots available for this date.</div>
          ) : (
            <>
              {/* Morning */}
              {timeSlots.morning.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3" style={{ fontWeight: 500 }}>🌅 Morning</p>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.morning.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-xl text-sm transition-all ${
                          selectedTime === time
                            ? "bg-[#0A66C2] text-white shadow-md"
                            : "bg-white text-gray-700 border border-gray-200 hover:border-[#0A66C2]"
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Afternoon */}
              {timeSlots.afternoon.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3" style={{ fontWeight: 500 }}>☀️ Afternoon</p>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.afternoon.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-xl text-sm transition-all ${
                          selectedTime === time
                            ? "bg-[#0A66C2] text-white shadow-md"
                            : "bg-white text-gray-700 border border-gray-200 hover:border-[#0A66C2]"
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Evening */}
              {timeSlots.evening.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3" style={{ fontWeight: 500 }}>🌙 Evening</p>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.evening.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-xl text-sm transition-all ${
                          selectedTime === time
                            ? "bg-[#0A66C2] text-white shadow-md"
                            : "bg-white text-gray-700 border border-gray-200 hover:border-[#0A66C2]"
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-[#e8f4fd] to-white p-5 rounded-2xl border border-[#0A66C2]/20">
          <h4 className="text-gray-900 mb-3" style={{ fontWeight: 600 }}>Appointment Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Date</span>
              <span className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{selectedDateObj.date} {selectedDateObj.month}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Time</span>
              <span className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{selectedTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Type</span>
              <span className="text-sm text-gray-900" style={{ fontWeight: 500 }}>
                {consultType === "video" ? "Video Call" : "Chat Consultation"}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>Total Amount</span>
              <span className="text-lg text-[#0A66C2]" style={{ fontWeight: 600 }}>
                ₹{consultType === "video" ? "599" : "399"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Confirm Button */}
      <div className="fixed bottom-0 left-64 right-0 p-6 bg-white border-t border-gray-200 shadow-lg">
        <Button 
          onClick={handleConfirm}
          disabled={!selectedTime}
          className="w-full bg-gradient-to-r from-[#0A66C2] to-[#084a8f] hover:from-[#084a8f] hover:to-[#0A66C2] text-white rounded-2xl h-14 shadow-lg text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-5 h-5" />
          Confirm Appointment
        </Button>
        <p className="text-center text-xs text-gray-500 mt-3">
          🔒 Secure payment • Cancel anytime before 2 hours
        </p>
      </div>
      </div>
    </div>
  );
}