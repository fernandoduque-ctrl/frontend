import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOKEN_KEY } from '@/constants/storageKeys';

export function useAuth() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem(TOKEN_KEY), []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    navigate('/login', { replace: true });
  }, [navigate]);

  const setToken = useCallback((t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
  }, []);

  return { token, isAuthenticated: !!localStorage.getItem(TOKEN_KEY), logout, setToken };
}
