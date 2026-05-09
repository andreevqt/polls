import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import { renderWithProviders, resetAuthStore } from '../../test/renderHelpers';
import LoginPage from '../LoginPage';
import * as authApi from '../../api/auth';
import { makeUser } from '../../test/factories';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../api/auth');
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    resetAuthStore();
    vi.clearAllMocks();
  });

  it('renders the login form', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error toast on 401', async () => {
    vi.mocked(authApi.login).mockRejectedValue({ response: { status: 401 } });

    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Invalid email or password');
    });
  });

  it('redirects to /dashboard on successful login', async () => {
    const user = makeUser({ name: 'Alice', email: 'alice@example.com' });
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'test-token',
      user,
    });

    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
