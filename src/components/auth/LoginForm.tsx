import React, { useState, useCallback, memo } from 'react';
import { Stethoscope, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthProvider';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { validateEmail, validatePassword } from '../../utils/helpers';

type AuthMode = 'login' | 'register' | 'forgot-password';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  username: string;
  role: 'doctor' | 'receptionist';
}

const initialFormData: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  username: '',
  role: 'doctor'
};

const LoginFormComponent: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { login, register, resetPassword } = useAuthContext();

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setError('');
    setSuccess('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, []);

  const handleModeChange = useCallback((mode: AuthMode) => {
    setAuthMode(mode);
    resetForm();
  }, [resetForm]);

  const updateFormData = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
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
      if (!result.success) {
        setError(result.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
    
    setLoading(false);
  }, [formData.email, formData.password, login]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
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
        formData.role
      );
      
      if (result.success) {
        setSuccess('Registration successful! You can now sign in.');
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
  }, [formData, register, resetForm]);

  const handleForgotPassword = useCallback(async (e: React.FormEvent) => {
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
  }, [formData.email, resetPassword]);

  const getTitle = () => {
    switch (authMode) {
      case 'register': return 'Create Account';
      case 'forgot-password': return 'Reset Password';
      default: return 'Sign In';
    }
  };

  const getSubtitle = () => {
    switch (authMode) {
      case 'register': return 'Create your MedCare EHR account';
      case 'forgot-password': return 'Enter your email to reset your password';
      default: return 'Please sign in to your account';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Stethoscope className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            MedCare EHR System
          </h2>
          <h3 className="mt-2 text-xl font-semibold text-gray-700">
            {getTitle()}
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            {getSubtitle()}
          </p>
        </div>
        
        <Card>
          {/* Login Form */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                required
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="Enter your email"
              />
              
              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}

              <Button type="submit" loading={loading} className="w-full">
                Sign in
              </Button>
              
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </button>
                <div className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('register')}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Register Form */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => updateFormData('role', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              </div>

              <Input
                label="Full Name"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => updateFormData('fullName', e.target.value)}
                placeholder="Enter your full name"
              />

              <Input
                label="Username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => updateFormData('username', e.target.value)}
                placeholder="Enter your username"
              />
              
              <Input
                label="Email Address"
                type="email"
                required
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="Enter your email"
              />
              
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                placeholder="Enter your password (min 6 characters)"
              />

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
              />

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              {success && <div className="text-green-600 text-sm text-center">{success}</div>}

              <Button type="submit" loading={loading} className="w-full">
                Create account
              </Button>
              
              <div className="text-center">
                <div className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {authMode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                required
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="Enter your email"
              />

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              {success && <div className="text-green-600 text-sm text-center">{success}</div>}

              <Button type="submit" loading={loading} className="w-full">
                Send reset email
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to sign in
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export const LoginForm = memo(LoginFormComponent);