import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { HOME_BY_ROLE } from '@/lib/roleHome';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import EMSCommandCenter from '@/pages/EMSCommandCenter';
import AmbulanceStaffDashboard from '@/pages/AmbulanceStaffDashboard';
import DoctorDashboard from '@/pages/DoctorDashboard';
import FamilyDashboard from '@/pages/FamilyDashboard';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? HOME_BY_ROLE[user.role] : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/ems"
            element={
              <ProtectedRoute role="ems_command">
                <EMSCommandCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ambulance"
            element={
              <ProtectedRoute role="ambulance_staff">
                <AmbulanceStaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <ProtectedRoute role="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/family"
            element={
              <ProtectedRoute role="family">
                <FamilyDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
