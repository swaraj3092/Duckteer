import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Download, FileText, Calendar, User as UserIcon, Home, User, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { DemoNav } from "../components/DemoNav";
import { API_BASE_URL, getAuthHeaders } from "../api";

export function MedicalRecords() {
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalVisits: 0, thisYear: 0, specialists: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchRecords = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/medical-records`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (res.ok) {
          setRecords(data.records || []);
          if (data.stats) setStats(data.stats);
        } else {
          console.error("Failed to fetch records:", data.message);
        }
      } catch (err) {
        console.error("Error fetching medical records:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <DemoNav />
      <div className="flex-1 md:ml-64 flex flex-col relative pb-24">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#084a8f] px-4 md:px-6 pt-16 md:pt-28 pb-6 text-white rounded-b-[2rem] shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/" className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl" style={{ fontWeight: 600 }}>Medical Records</h1>
            <p className="text-white/80 text-sm mt-1">Your health history & prescriptions</p>
          </div>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 mt-4 border border-white/30">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/30 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white text-lg" style={{ fontWeight: 600 }}>{user ? user.name : "Ramesh Gupta"}</p>
              <p className="text-white/80 text-sm">Patient</p>
              <p className="text-white/70 text-xs mt-1">ID: {user ? user.patientId : "MED2026001234"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-6 -mt-6 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow-md p-4 text-center border border-gray-100">
            <p className="text-2xl text-[#0A66C2] mb-1" style={{ fontWeight: 600 }}>{stats.totalVisits}</p>
            <p className="text-xs text-gray-600">Total Visits</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center border border-gray-100">
            <p className="text-2xl text-[#0A66C2] mb-1" style={{ fontWeight: 600 }}>{stats.thisYear}</p>
            <p className="text-xs text-gray-600">This Year</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center border border-gray-100">
            <p className="text-2xl text-[#0A66C2] mb-1" style={{ fontWeight: 600 }}>{stats.specialists}</p>
            <p className="text-xs text-gray-600">Specialists</p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-green-900" style={{ fontWeight: 600 }}>Secure & Encrypted</p>
            <p className="text-xs text-green-700 mt-1">
              Your medical records are protected with bank-level encryption and comply with healthcare privacy standards.
            </p>
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="px-6">
        <h2 className="text-lg text-gray-900 mb-4" style={{ fontWeight: 600 }}>Consultation History</h2>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-500 py-4">Loading records...</div>
          ) : records.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No medical records found.</div>
          ) : (
            records.map((record) => (
              <div key={record._id || record.id} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-5">
                  {/* Date */}
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-[#0A66C2]" />
                    <span className="text-sm text-gray-600" style={{ fontWeight: 500 }}>
                      {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : record.date}
                    </span>
                  </div>

                  {/* Doctor Info */}
                  <h3 className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>{record.doctorName || record.doctor}</h3>
                  <p className="text-sm text-[#0A66C2] mb-3" style={{ fontWeight: 500 }}>{record.specialty}</p>

                  {/* Diagnosis */}
                  <div className="bg-[#f8f9fb] rounded-xl p-3 mb-4 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Diagnosis</p>
                    <p className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{record.diagnosis}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-[#0A66C2] hover:bg-[#084a8f] text-white rounded-xl h-10 flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      Download Prescription
                    </Button>
                    <Button 
                      variant="outline" 
                      className="px-4 rounded-xl border-gray-300 hover:border-[#0A66C2] hover:text-[#0A66C2]"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        <button className="w-full mt-4 py-3 text-[#0A66C2] text-sm hover:bg-[#e8f4fd] rounded-xl transition-colors" style={{ fontWeight: 500 }}>
          Load More Records →
        </button>
      </div>

      {/* Upload Documents Section */}
      <div className="px-6 mt-6">
        <div className="bg-gradient-to-br from-[#e8f4fd] to-white rounded-2xl p-5 border-2 border-dashed border-[#0A66C2]/30">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#0A66C2] flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-gray-900 mb-2" style={{ fontWeight: 600 }}>Upload Medical Documents</h3>
            <p className="text-sm text-gray-600 mb-4">
              Lab reports, previous prescriptions, or other medical documents
            </p>
            <Button className="bg-[#0A66C2] hover:bg-[#084a8f] text-white rounded-xl px-6">
              Choose Files
            </Button>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}
