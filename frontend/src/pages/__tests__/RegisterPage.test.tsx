import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import { renderWithProviders, resetAuthStore } from '../../test/renderHelpers';
import RegisterPage from '../RegisterPage';
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

describe('RegisterPage', () => {
  beforeEach(() => {
    resetAuthStore();
    vi.clearAllMocks();
  });

  it('renders the registration form', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('validates password minimum length', async () => {
    renderWithProviders(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/^name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'short');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('shows 409 conflict error toast', async () => {
    vi.mocked(authApi.register).mockRejectedValue({ response: { status: 409 } });

    renderWithProviders(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/^name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        'Registration failed. Email may already be in use.',
      );
    });
  });

  it('redirects to /dashboard on successful registration', async () => {
    const user = makeUser({ name: 'Alice', email: 'alice@example.com' });
    vi.mocked(authApi.register).mockResolvedValue({
      accessToken: 'test-token',
      user,
    });

    renderWithProviders(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/^name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
