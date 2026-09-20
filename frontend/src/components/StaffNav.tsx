import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/** Top navigation shared by the protected staff pages. */
export function StaffNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-3 py-2 text-sm font-bold transition ${
      isActive ? 'bg-cream text-espresso' : 'text-cream/80 hover:bg-cream/10'
    }`;

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between bg-espresso px-3 py-2 shadow-card">
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>
          ☕
        </span>
        <span className="hidden font-display text-sm font-extrabold uppercase tracking-widest text-cream sm:inline">
          Bean Tradition
        </span>
      </div>
      <div className="flex items-center gap-1">
        <NavLink to="/place-order" className={linkClass}>
          Place order
        </NavLink>
        <NavLink to="/orders" className={linkClass}>
          Orders
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl px-3 py-2 text-sm font-bold text-cream/80 hover:bg-cream/10"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default StaffNav;
