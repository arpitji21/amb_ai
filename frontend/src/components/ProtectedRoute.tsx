import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import type { Role } from '@/types';
import { HOME_BY_ROLE } from '@/lib/roleHome';

export default function ProtectedRoute({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

  return <>{children}</>;
}
