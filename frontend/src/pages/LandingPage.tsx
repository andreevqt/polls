import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Polls</h1>
        <p className="mt-3 text-lg text-gray-600">Create and share polls with ease.</p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            to="/login"
            className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
