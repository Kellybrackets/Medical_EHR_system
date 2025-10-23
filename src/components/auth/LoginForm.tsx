import React, { useState, useCallback, memo } from 'react';
import { Stethoscope, ArrowLeft, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthProvider';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { MedicalIllustration } from './MedicalIllustration';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
      <div className="min-h-screen flex">
        {/* Left Column - Medical Illustration (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 p-8 items-center justify-center">
          <MedicalIllustration />
        </div>

        {/* Right Column - Login Form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 shadow-lg mb-4">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                MedCare EHR
              </h2>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                {getTitle()}
              </h3>
              <p className="text-sm text-gray-600">
                {getSubtitle()}
              </p>
            </div>

            <Card className="shadow-2xl border-0">
          {/* Login Form */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    placeholder="Enter your password"
                    className="block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
                Sign In
              </Button>
              
              <div className="text-center space-y-3">
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Forgot your password?
                </button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('register')}
                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    Create Account
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    placeholder="Enter your password (min 6 characters)"
                    className="block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    className="block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
                Create Account
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
                Send Reset Email
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
      </div>
    </div>
  );
};

export const LoginForm = memo(LoginFormComponent);