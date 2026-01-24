/**
 * Login Page
 * Authentication page with real API integration and 2FA support
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Shield, ArrowLeft } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { login, verify2FA, isLoading, error, clearError, requires2FA, clear2FA } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await login(formData);
      if (!result.requires2FA) {
        navigate('/app/dashboard');
      }
      // If 2FA required, the state will update and show 2FA form
    } catch (err) {
      // Error is handled by the store
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await verify2FA(twoFACode);
      navigate('/app/dashboard');
    } catch (err) {
      // Error is handled by the store
    }
  };

  const handleBack = () => {
    clear2FA();
    setTwoFACode('');
  };

  // 2FA Code Input Form
  if (requires2FA) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/images/logo.png" alt="InvestiGate" className="h-40 mx-auto mb-2" />
            <p className="text-gray-400">Investigation Management Platform</p>
          </div>

          {/* 2FA Card */}
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Two-Factor Authentication</h2>
            </div>

            <p className="text-gray-400 mb-6">
              Enter the 6-digit code from your authenticator app to continue.
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handle2FASubmit} className="space-y-5">
              {/* 2FA Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                  Verification Code
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={twoFACode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setTwoFACode(value);
                    if (error) clearError();
                  }}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-widest"
                  autoComplete="one-time-code"
                  disabled={isLoading}
                  autoFocus
                />
                <p className="text-gray-500 text-sm mt-2">
                  You can also use a backup code if you don't have access to your authenticator.
                </p>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isLoading || twoFACode.length < 6}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>

              {/* Back Button */}
              <Button 
                type="button" 
                variant="secondary" 
                className="w-full" 
                onClick={handleBack}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </form>
          </Card>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-8">
            &copy; 2024 InvestiGate. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  // Normal Login Form
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/images/logo.png" alt="InvestiGate" className="h-40 mx-auto mb-2" />
          <p className="text-gray-400">Investigation Management Platform</p>
        </div>

        {/* Login Card */}
        <Card className="p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-400">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary-400 hover:text-primary-300">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300">
              Request Access
            </Link>
          </p>
        </Card>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          &copy; 2024 InvestiGate. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export { Login as LoginPage };
