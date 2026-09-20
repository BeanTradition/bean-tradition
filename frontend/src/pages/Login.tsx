import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError, getMe, login } from '../services/api';

interface LocationState {
  from?: string;
}

export function Login() {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/place-order';

  // If already authenticated, skip the login screen.
  useEffect(() => {
    let active = true;
    void getMe()
      .then((me) => {
        if (active && me.authenticated) navigate(from, { replace: true });
      })
      .catch(() => {
        /* stay on login */
      });
    return () => {
      active = false;
    };
  }, [from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await login(password);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 0
          ? 'Cannot reach the server. Check your connection.'
          : 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-espresso text-4xl">
          ☕
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold uppercase tracking-[0.18em] text-espresso">
          Bean Tradition
        </h1>
        <p className="mt-1 font-medium text-mocha">Staff sign in</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6">
        <label htmlFor="password" className="label">
          Access password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          inputMode="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
          placeholder="Enter staff password"
          autoFocus
        />

        {error && (
          <p className="mt-3 rounded-xl bg-cancelled/10 px-3 py-2 text-sm font-semibold text-cancelled">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !password}
          className="btn btn-primary btn-lg mt-5 w-full"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default Login;
