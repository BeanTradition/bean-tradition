import { useCallback, useEffect, useRef, useState } from 'react';
import { getMe, logout as apiLogout } from '../services/api';

export type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

export interface UseAuthResult {
  state: AuthState;
  subject: string | null;
  refresh: () => Promise<boolean>;
  logout: () => Promise<void>;
}

/**
 * Checks the cookie session against GET /api/auth/me. Used by ProtectedRoute
 * and the Orders header (for logout + counter identity).
 */
export function useAuth(): UseAuthResult {
  const [state, setState] = useState<AuthState>('checking');
  const [subject, setSubject] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const me = await getMe();
      if (!mounted.current) return me.authenticated;
      if (me.authenticated) {
        setState('authenticated');
        setSubject(me.subject ?? null);
        return true;
      }
      setState('unauthenticated');
      setSubject(null);
      return false;
    } catch {
      if (mounted.current) {
        setState('unauthenticated');
        setSubject(null);
      }
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore; we still clear local state below.
    }
    if (mounted.current) {
      setState('unauthenticated');
      setSubject(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, subject, refresh, logout };
}
