import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { logout } from '../../api/auth';

interface NavItem {
  label: string;
  to: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/admin'},
  { label: 'Users', to: '/admin/users'},
  { label: 'Polls', to: '/admin/polls'},
  { label: 'Analytics', to: '/admin/analytics'},
  { label: 'System', to: '/admin/system'  },
];

export default function AdminSidebar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // ignore logout errors
    } finally {
      clearAuth();
      navigate('/login');
    }
  }

  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-700 px-6">
        <span className="text-xl font-bold text-indigo-400">Polls</span>
        <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info + logout */}
      <div className="border-t border-gray-700 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
