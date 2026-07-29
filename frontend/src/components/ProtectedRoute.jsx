import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, ownerOnly = false }) {
  const { user, isOwner } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (ownerOnly && !isOwner) return <Navigate to="/" replace />;
  return children;
}
