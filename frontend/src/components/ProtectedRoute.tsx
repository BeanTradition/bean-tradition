import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Guards protected pages. Checks GET /api/auth/me; redirects to /login when the
 * session cookie is missing or invalid.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useAuth();
  const location = useLocation();

  if (state === 'checking') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="inline-flex items-center gap-2 text-mocha">
          <span className="h-3 w-3 animate-pulse rounded-full bg-caramel" />
          Checking session…
        </span>
      </div>
    );
  }

  if (state === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
