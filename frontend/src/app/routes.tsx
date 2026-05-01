import { createBrowserRouter } from "react-router";
import { Login } from "./screens/Login";
import { VerifyOTP } from "./screens/VerifyOTP";
import { PatientHome } from "./screens/PatientHome";
import { DoctorList } from "./screens/DoctorList";
import { Booking } from "./screens/Booking";
import { VideoCall } from "./screens/VideoCall";
import { DoctorDashboard } from "./screens/DoctorDashboard";
import { MedicalRecords } from "./screens/MedicalRecords";
import { DoctorSetup } from "./screens/DoctorSetup";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/verify-otp",
    Component: VerifyOTP,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <PatientHome />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctors",
    element: (
      <ProtectedRoute>
        <DoctorList />
      </ProtectedRoute>
    ),
  },
  {
    path: "/booking/:doctorId",
    element: (
      <ProtectedRoute>
        <Booking />
      </ProtectedRoute>
    ),
  },
  {
    path: "/video-call/:appointmentId",
    element: (
      <ProtectedRoute>
        <VideoCall />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor-dashboard",
    element: (
      <ProtectedRoute>
        <DoctorDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/setup",
    element: (
      <ProtectedRoute>
        <DoctorSetup />
      </ProtectedRoute>
    ),
  },
  {
    path: "/medical-records",
    element: (
      <ProtectedRoute>
        <MedicalRecords />
      </ProtectedRoute>
    ),
  },
]);
