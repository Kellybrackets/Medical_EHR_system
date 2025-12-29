import { render, screen } from '@testing-library/react';
import { LoginForm } from './LoginForm';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock the AuthProvider and useAuthContext
vi.mock('../../contexts/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    loading: false,
    error: null,
  }),
}));

describe('LoginForm', () => {
  it('renders the login form by default', () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });
});
