import { render, screen } from '@testing-library/react';
import { LoginForm } from './LoginForm';
import { AuthProvider } from '../../contexts/AuthProvider';

describe('LoginForm', () => {
  it('renders the login form by default', () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
