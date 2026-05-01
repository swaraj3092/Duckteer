import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Star, Clock, Languages, ArrowLeft, Home, User, FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import { DemoNav } from "../components/DemoNav";
import { API_BASE_URL } from "../api";

export function DoctorList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSpecialty = searchParams.get("specialty") || "";
  
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);

  const specialtiesList = ["Cardiologist", "Neurologist", "Oncologist", "Dermatologist"];

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE_URL}/doctors`;
        if (selectedSpecialty) {
          url += `?specialty=${encodeURIComponent(selectedSpecialty)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) {
          setDoctors(data.doctors || []);
        } else {
          console.error("Failed to fetch doctors:", data.message);
        }
      } catch (err) {
        console.error("Error fetching doctors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [selectedSpecialty]);

  const handleSpecialtyClick = (specialty: string) => {
    if (specialty === selectedSpecialty) {
      setSelectedSpecialty("");
      setSearchParams(new URLSearchParams());
    } else {
      setSelectedSpecialty(specialty);
      setSearchParams({ specialty });
    }
  };

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
            <h1 className="text-2xl" style={{ fontWeight: 600 }}>Available Specialists</h1>
            <p className="text-white/80 text-sm mt-1">Find the right doctor for you</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-4">
          <button 
            onClick={() => handleSpecialtyClick("")}
            className={`px-4 py-2 ${!selectedSpecialty ? "bg-white text-[#0A66C2]" : "bg-white/20 text-white backdrop-blur-md"} rounded-full text-sm whitespace-nowrap`} 
            style={{ fontWeight: !selectedSpecialty ? 500 : 400 }}
          >
            All Specialists
          </button>
          
          {specialtiesList.map(spec => (
            <button 
              key={spec}
              onClick={() => handleSpecialtyClick(spec)}
              className={`px-4 py-2 ${selectedSpecialty === spec ? "bg-white text-[#0A66C2]" : "bg-white/20 text-white backdrop-blur-md"} rounded-full text-sm whitespace-nowrap`}
              style={{ fontWeight: selectedSpecialty === spec ? 500 : 400 }}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards */}
      <div className="px-4 py-6 space-y-4">
        {loading ? (
          <div className="text-center text-gray-500">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="text-center text-gray-500">No doctors available.</div>
        ) : (
          doctors.map((doctor) => (
            <div key={doctor._id || doctor.id} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
              <div className="p-5">
                <div className="flex gap-4">
                  {/* Doctor Image */}
                  <img 
                    src={doctor.image || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2670&auto=format&fit=crop"} 
                    alt={doctor.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#e8f4fd]"
                  />
                  
                  {/* Doctor Info */}
                  <div className="flex-1">
                    <h3 className="text-lg text-gray-900" style={{ fontWeight: 600 }}>{doctor.name}</h3>
                    <p className="text-sm text-[#0A66C2]" style={{ fontWeight: 500 }}>{doctor.specialty}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{doctor.rating}</span>
                      </div>
                      <span className="text-xs text-gray-500">{doctor.experience} exp.</span>
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div className="flex items-center gap-2 mt-4 p-3 bg-[#f8f9fb] rounded-xl">
                  <Languages className="w-4 h-4 text-[#0A66C2]" />
                  <p className="text-sm text-gray-600">
                    {doctor.languages?.join(", ") || "English"}
                  </p>
                </div>

                {/* Next Slot */}
                <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                  <Clock className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-700" style={{ fontWeight: 500 }}>
                    {doctor.nextSlot || "Check schedule"}
                  </p>
                </div>

                {/* Book Button */}
                <Link to={`/booking/${doctor._id || doctor.id}`}>
                  <Button className="w-full mt-4 bg-[#0A66C2] hover:bg-[#084a8f] text-white rounded-xl h-12 shadow-sm">
                    📹 Book Video Consult
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      </div>
    </div>
  );
}
