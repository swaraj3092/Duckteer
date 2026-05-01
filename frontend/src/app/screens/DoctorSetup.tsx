import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Shield, ArrowLeft, Stethoscope, Briefcase, Languages, Banknote } from "lucide-react";
import { Button } from "../components/ui/button";
import { DemoNav } from "../components/DemoNav";

export function DoctorSetup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "Dr. ",
    specialty: "",
    experience: "",
    languages: "English, Hindi",
    feeVideo: "599",
    feeChat: "399",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Get the token. If doing this in the real flow, it would be from localStorage
      const token = localStorage.getItem("token") || ""; 
      
      const res = await fetch("http://localhost:5000/api/auth/doctor/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          specialty: formData.specialty,
          experience: formData.experience,
          languages: formData.languages.split(",").map(l => l.trim()),
          feeVideo: formData.feeVideo,
          feeChat: formData.feeChat,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to register");
      }

      // Automatically update the cached user
      if (data.user) {
         localStorage.setItem("user", JSON.stringify(data.user));
         localStorage.setItem("token", data.token); // update the token with new role if needed
      }

      navigate("/doctor-dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <DemoNav />
      <div className="flex-1 ml-64 flex flex-col relative pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#084a8f] px-6 pt-28 pb-8 text-white rounded-b-[2rem] shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/" className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl" style={{ fontWeight: 600 }}>Doctor Registration</h1>
            <p className="text-white/80 text-sm mt-1">Join MediConnect as a Specialist</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-700 text-sm mb-1" style={{ fontWeight: 600 }}>Full Name</label>
              <div className="flex items-center gap-3 bg-[#f8f9fb] rounded-xl px-4 py-3 border border-gray-200">
                <Shield className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Dr. Rajesh Kumar"
                  className="flex-1 bg-transparent outline-none text-gray-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-1" style={{ fontWeight: 600 }}>Specialty</label>
              <div className="flex items-center gap-3 bg-[#f8f9fb] rounded-xl px-4 py-3 border border-gray-200">
                <Stethoscope className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder="Cardiologist, Neurologist..."
                  className="flex-1 bg-transparent outline-none text-gray-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-1" style={{ fontWeight: 600 }}>Experience</label>
              <div className="flex items-center gap-3 bg-[#f8f9fb] rounded-xl px-4 py-3 border border-gray-200">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="e.g. 15 years"
                  className="flex-1 bg-transparent outline-none text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-1" style={{ fontWeight: 600 }}>Languages Spoken</label>
              <div className="flex items-center gap-3 bg-[#f8f9fb] rounded-xl px-4 py-3 border border-gray-200">
                <Languages className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  placeholder="English, Hindi, Marathi"
                  className="flex-1 bg-transparent outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 text-sm mb-1" style={{ fontWeight: 600 }}>Video Fee (₹)</label>
                <div className="flex items-center gap-3 bg-[#f8f9fb] rounded-xl px-4 py-3 border border-gray-200">
                  <Banknote className="w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="feeVideo"
                    value={formData.feeVideo}
                    onChange={handleChange}
                    className="flex-1 bg-transparent outline-none text-gray-900 w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1" style={{ fontWeight: 600 }}>Chat Fee (₹)</label>
                <div className="flex items-center gap-3 bg-[#f8f9fb] rounded-xl px-4 py-3 border border-gray-200">
                  <Banknote className="w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="feeChat"
                    value={formData.feeChat}
                    onChange={handleChange}
                    className="flex-1 bg-transparent outline-none text-gray-900 w-full"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#0A66C2] to-[#084a8f] hover:from-[#084a8f] hover:to-[#0A66C2] text-white rounded-xl h-14 text-base shadow-lg mt-4 disabled:opacity-50"
            >
              {isLoading ? "Registering..." : "Complete Registration"}
            </Button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
