import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { TOKEN_KEY } from '@/constants/storageKeys';

export function ProtectedRoute() {
  const loc = useLocation();
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <Outlet />;
}
