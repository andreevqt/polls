import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { router } from './router';
import { useAuthStore } from './store/authStore';
import { refresh } from './api/auth';
import { getMe } from './api/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function AppInitializer() {
  const { setAuth, setInitialized } = useAuthStore();

  useEffect(() => {
    async function initSession() {
      try {
        const { accessToken } = await refresh();
        const user = await getMe();
        setAuth(user, accessToken);
      } catch {
        // No valid session — that's fine, user is anonymous
      } finally {
        setInitialized();
      }
    }

    initSession();
  }, [setAuth, setInitialized]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer />
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '8px',
            fontSize: '14px',
          },
        }}
      />
    </QueryClientProvider>
  );
}
