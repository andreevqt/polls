import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminPollsPage from './pages/admin/AdminPollsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminSystemPage from './pages/admin/AdminSystemPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PollPage from './pages/PollPage';
import PollAnalyticsPage from './pages/PollAnalyticsPage';
import NotFoundPage from './pages/NotFoundPage';

export const router = createBrowserRouter([
  // Public routes
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // Protected user routes
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/dashboard/polls/:slug/analytics', element: <PollAnalyticsPage /> },
    ],
  },

  // Admin routes — require ADMIN role, wrapped in AdminLayout
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AdminDashboardPage /> },
          { path: '/admin/users', element: <AdminUsersPage /> },
          { path: '/admin/polls', element: <AdminPollsPage /> },
          { path: '/admin/analytics', element: <AdminAnalyticsPage /> },
          { path: '/admin/system', element: <AdminSystemPage /> },
        ],
      },
    ],
  },

  // Public poll-taking page — must come after all named routes, before catch-all
  { path: '/:slug', element: <PollPage /> },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);
