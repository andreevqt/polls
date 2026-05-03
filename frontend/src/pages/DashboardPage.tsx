import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">Welcome back, {user?.name}</p>
          </div>
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Admin Panel
            </Link>
          )}
        </div>
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          <p className="text-lg font-medium">Your polls will appear here.</p>
          <p className="mt-2 text-sm">Poll management coming soon.</p>
        </div>
      </div>
    </div>
  );
}
