/**
 * Custom render helpers that wrap components with required providers.
 */
import { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types/user'

/** Create a fresh QueryClient for each test (no retries, no caching). */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

interface RenderWithProvidersOptions extends RenderOptions {
  routerProps?: MemoryRouterProps
  queryClient?: QueryClient
  /** Pre-populate the auth store with this user */
  user?: User | null
}

/**
 * Render a component wrapped in MemoryRouter + QueryClientProvider.
 * Optionally seeds the Zustand auth store.
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    routerProps = {},
    queryClient,
    user,
    ...renderOptions
  }: RenderWithProvidersOptions = {},
) {
  const client = queryClient ?? createTestQueryClient()

  // Seed auth store if a user is provided
  if (user !== undefined) {
    const store = useAuthStore.getState()
    if (user) {
      store.setAuth(user, 'test-access-token')
    } else {
      store.clearAuth()
    }
    store.setInitialized()
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter {...routerProps}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/** Reset auth store between tests. */
export function resetAuthStore() {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isInitialized: false,
  })
}
