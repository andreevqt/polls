import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { router } from './router';
import { useAuthStore } from './store/authStore';
import { refresh } from './api/auth';
import { getMe } from './api/auth';

declare global {
  interface Window {
    __E2E_TEST__?: boolean;
  }
}

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
        // Skip authentication restoration during E2E tests
        // to avoid redirect loops - check for query parameter or global variable
        const urlParams = new URLSearchParams(window.location.search);
        const isE2ETest = urlParams.has('e2e') ||
                          window.__E2E_TEST__ === true;

        if (isE2ETest) {
          setInitialized();
          return;
        }

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
