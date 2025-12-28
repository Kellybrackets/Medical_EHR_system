import React, { useState, useCallback, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Stethoscope } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthProvider';
import { Button } from '../ui/Button';
import { validateEmail, validatePassword } from '../../utils/helpers';
// import { supabase } from '../../lib/supabase';
// import { Practice } from '../../types';
import { APP_NAME } from '../../utils/constants';

type AuthMode = 'login' | 'register' | 'forgot-password';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  username: string;
}

const initialFormData: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  username: '',
};

const LoginFormComponent: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // const [loadingPractices, setLoadingPractices] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, register, resetPassword, user, loginWithGoogle } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setError('');
    setSuccess('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, []);

  const handleModeChange = useCallback(
    (mode: AuthMode) => {
      setAuthMode(mode);
      resetForm();
    },
    [resetForm],
  );

  const updateFormData = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    try {
      const result = await loginWithGoogle();
      if (!result.success && result.error) {
        setError(result.error);
      }
      // Success will redirect automatically via OAuth flow
    } catch (error) {
      setError('Failed to initiate Google sign in. Please try again.');
    }
  }, [loginWithGoogle]);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      if (!validateEmail(formData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (!validatePassword(formData.password)) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      try {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          navigate('/');
        } else {
          setError(result.error || 'Invalid credentials. Please try again.');
        }
      } catch {
        setError('An unexpected error occurred. Please try again.');
      }

      setLoading(false);
    },
    [formData.email, formData.password, login, navigate],
  );

  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      if (!validateEmail(formData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (!validatePassword(formData.password)) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (!formData.fullName.trim()) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }

      if (!formData.username.trim()) {
        setError('Please enter a username');
        setLoading(false);
        return;
      }

      try {
        const result = await register(
          formData.email,
          formData.password,
          formData.fullName.trim(),
          formData.username.trim(),
        );

        if (result.success) {
          setSuccess('Registration successful! Please confirm your email before you sign in.');
          setError('');
          resetForm();
          setTimeout(() => {
            setAuthMode('login');
            setSuccess('');
          }, 3000);
        } else {
          setError(result.error || 'Registration failed. Please try again.');
        }
      } catch {
        setError('An unexpected error occurred during registration.');
      }

      setLoading(false);
    },
    [formData, register, resetForm],
  );

  const handleForgotPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      if (!validateEmail(formData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      try {
        const result = await resetPassword(formData.email);
        if (result.success) {
          setSuccess('Password reset email sent! Please check your inbox.');
          setError('');
        } else {
          setError(result.error || 'Failed to send reset email. Please try again.');
        }
      } catch {
        setError('An unexpected error occurred. Please try again.');
      }

      setLoading(false);
    },
    [formData.email, resetPassword],
  );

  const getTitle = () => {
    switch (authMode) {
      case 'register':
        return `Join ${APP_NAME}`;
      case 'forgot-password':
        return 'Reset Password';
      default:
        return `Welcome back to ${APP_NAME}`;
    }
  };

  const getSubtitle = () => {
    switch (authMode) {
      case 'register':
        return 'Start your journey with us today.';
      case 'forgot-password':
        return 'We\'ll help you get back on track.';
      default:
        return 'Log in to access your workspace.';
    }
  };

  // Custom Input Component for Floating Label Style
  const CustomInput = ({
    label,
    value,
    onChange,
    type = 'text',
    endIcon,
    required,
    placeholder
  }: {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    endIcon?: React.ReactNode;
    required?: boolean;
    placeholder?: string;
  }) => (
    <div className="relative border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-sm group">
      <label className="block text-xs font-semibold text-gray-500 mb-0.5 group-focus-within:text-blue-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center">
        <input
          type={type}
          value={value}
          onChange={onChange}
          className="block w-full border-0 p-0 text-gray-900 placeholder-transparent focus:ring-0 sm:text-sm bg-transparent"
          placeholder={placeholder || label}
        />
        {endIcon && <div className="ml-2">{endIcon}</div>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Column - Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-black/60 z-10" />
        <img
          src="/login-medical.png"
          alt="Medical Professional"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="relative z-20 flex flex-col justify-between h-full p-12 text-white">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
          </div>
          <div className="max-w-md">
            <h2 className="text-3xl font-bold leading-tight mb-4">
              "Streamlines our clinical workflow and improves patient care."
            </h2>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">
                JD
              </div>
              <div>
                <p className="font-semibold">Dr. Jane Doe</p>
                <p className="text-sm text-gray-300">Chief Medical Officer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
              {getTitle()}
            </h1>
            <p className="text-gray-500">
              {getSubtitle()}
            </p>
          </div>

          <div className="space-y-6">
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <CustomInput
                  label="Email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  type="email"
                  required
                />
                <div className="space-y-1">
                  <CustomInput
                    label="Password"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    required
                    endIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
                  >
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${rememberMe ? 'bg-blue-600' : 'bg-gray-200'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${rememberMe ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span>Remember sign in details</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('forgot-password')}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start">
                    <span className="mr-2">⚠️</span> {error}
                  </div>
                )}

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all text-base"
                >
                  Log in
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-12 flex items-center justify-center space-x-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium transition-all"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.24-2.18-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="text-center mt-6">
                  <span className="text-gray-500 text-sm">Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => handleModeChange('register')}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm hover:underline"
                  >
                    Sign up
                  </button>
                </div>
              </form>
            )}

            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <CustomInput
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  required
                />
                <CustomInput
                  label="Username"
                  value={formData.username}
                  onChange={(e) => updateFormData('username', e.target.value)}
                  required
                />
                <CustomInput
                  label="Email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  type="email"
                  required
                />
                <CustomInput
                  label="Password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  required
                  endIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
                <CustomInput
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  endIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Create Account
                </Button>

                <div className="text-center mt-4">
                  <span className="text-gray-500 text-sm">Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm hover:underline"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            )}

            {authMode === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <CustomInput
                  label="Email Address"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  type="email"
                  required
                />

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Send Reset Email
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoginForm = memo(LoginFormComponent);
