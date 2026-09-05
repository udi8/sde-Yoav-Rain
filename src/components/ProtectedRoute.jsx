import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;

  return children;
}
