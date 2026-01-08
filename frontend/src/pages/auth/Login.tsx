import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button, Input } from '../../components/ui';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/30">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">InvestiGate</h1>
          <p className="text-dark-400 mt-1">ประตูสู่การสืบสวนยุคใหม่</p>
        </div>

        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-6">เข้าสู่ระบบ</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-dark-500 hover:text-dark-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              เข้าสู่ระบบ
            </Button>
          </form>
        </div>

        <p className="text-center text-dark-500 text-sm mt-6">
          InvestiGate Enterprise Edition v2.0
        </p>
      </div>
    </div>
  );
};
