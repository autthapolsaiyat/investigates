/**
 * Register Page
 * Public registration form for new users
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, UserPlus, Building2, Phone, Mail, User, Briefcase } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { registrationAPI } from '../../services/api';
import type { RegistrationCreate } from '../../services/api';

export default function Register() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<RegistrationCreate>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    organization_name: '',
    position: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      setError('Please fill in all required fields');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await registrationAPI.submit(formData);
      // Redirect to pending approval page with email
      navigate(`/pending-approval?email=${encodeURIComponent(formData.email)}`);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'An error occurred. Please try again';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/images/logo.png" alt="InvestiGate" className="h-32 mx-auto mb-2" />
          <p className="text-gray-400">Register for the system</p>
        </div>

        {/* Register Card */}
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Register</h2>
              <p className="text-sm text-gray-400">Create new account to use the system</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    placeholder="Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
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
                  className="pl-10"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1.5">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="0xx-xxx-xxxx"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Organization & Position Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="organization_name" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Organization
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="organization_name"
                    name="organization_name"
                    type="text"
                    placeholder="Organization name"
                    value={formData.organization_name}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Position
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="position"
                    name="position"
                    type="text"
                    placeholder="Job title"
                    value={formData.position}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                ConfirmPassword <span className="text-red-400">*</span>
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password again"
                value={confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Submit Registration
                </>
              )}
            </Button>
          </form>

          {/* Notice */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-sm">
              📋 After submission, admin will review and approve your registration
            </p>
          </div>

          {/* Login Link */}
          <p className="mt-6 text-center text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300">
              Sign In
            </Link>
          </p>
        </Card>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          &copy; 2024 InvestiGate. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export { Register as RegisterPage };
