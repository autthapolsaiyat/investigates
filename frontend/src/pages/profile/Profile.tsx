/**
 * Profile Page
 * User can view and edit their profile information
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Building, 
  Shield, 
  CreditCard,
  Edit2,
  Save,
  X,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle,
  AlertTriangle,
  Key
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';

export const Profile = () => {
  const { user, checkAuth } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
    position: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authAPI.updateProfile(formData);
      await checkAuth(); // Refresh user data
      setSuccess('Data saved successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || ''
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'super_admin': 'Super Admin',
      'org_admin': 'Organization Admin',
      'investigator': 'Investigator',
      'analyst': 'Analyst',
      'viewer': 'Viewer'
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colorMap: Record<string, string> = {
      'super_admin': 'bg-red-500/20 text-red-400',
      'org_admin': 'bg-purple-500/20 text-purple-400',
      'investigator': 'bg-blue-500/20 text-blue-400',
      'analyst': 'bg-green-500/20 text-green-400',
      'viewer': 'bg-gray-500/20 text-gray-400'
    };
    return colorMap[role] || 'bg-gray-500/20 text-gray-400';
  };

  const getSubscriptionStatus = () => {
    if (!user?.subscription_end) return null;
    
    const endDate = new Date(user.subscription_end);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { status: 'expired', color: 'text-red-400', bg: 'bg-red-500/10', text: 'Expired' };
    } else if (daysLeft <= 7) {
      return { status: 'expiring', color: 'text-yellow-400', bg: 'bg-yellow-500/10', text: `remaining ${daysLeft} days` };
    }
    return { status: 'active', color: 'text-green-400', bg: 'bg-green-500/10', text: `remaining ${daysLeft} days` };
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-dark-400 mt-1">Manage your personal information</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User size={20} />
              Personal Information
            </h2>
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-primary-400"
              >
                <Edit2 size={16} className="mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-dark-400"
                >
                  <X size={16} className="mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  <Save size={16} className="mr-1" />
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Email (Read Only) */}
            <div>
              <label className="block text-sm text-dark-400 mb-1">
                <Mail size={14} className="inline mr-1" />
                Email
              </label>
              <div className="px-3 py-2 bg-dark-700/50 rounded-lg text-dark-300">
                {user?.email}
              </div>
            </div>

            {/* First Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-dark-400 mb-1">
                  <User size={14} className="inline mr-1" />
                  Name
                </label>
                {isEditing ? (
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Enter name"
                  />
                ) : (
                  <div className="px-3 py-2 bg-dark-700/50 rounded-lg text-white">
                    {user?.first_name || '-'}
                  </div>
                )}
              </div>
              
              {/* Last Name */}
              <div>
                <label className="block text-sm text-dark-400 mb-1">
                  Last Name
                </label>
                {isEditing ? (
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Enter last name"
                  />
                ) : (
                  <div className="px-3 py-2 bg-dark-700/50 rounded-lg text-white">
                    {user?.last_name || '-'}
                  </div>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm text-dark-400 mb-1">
                <Phone size={14} className="inline mr-1" />
                Phone
              </label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone"
                />
              ) : (
                <div className="px-3 py-2 bg-dark-700/50 rounded-lg text-white">
                  {user?.phone || '-'}
                </div>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm text-dark-400 mb-1">
                <MapPin size={14} className="inline mr-1" />
                Department/Unit
              </label>
              {isEditing ? (
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Enter department"
                />
              ) : (
                <div className="px-3 py-2 bg-dark-700/50 rounded-lg text-white">
                  {user?.department || '-'}
                </div>
              )}
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm text-dark-400 mb-1">
                <Briefcase size={14} className="inline mr-1" />
                Position
              </label>
              {isEditing ? (
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Enter position"
                />
              ) : (
                <div className="px-3 py-2 bg-dark-700/50 rounded-lg text-white">
                  {user?.position || '-'}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Side Cards */}
        <div className="space-y-6">
          {/* Role & Organization */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Shield size={16} />
              Role and Organization
            </h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-xs text-dark-400">Role</span>
                <div className={`mt-1 inline-block px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user?.role || '')}`}>
                  {getRoleDisplay(user?.role || '')}
                </div>
              </div>
              
              <div>
                <span className="text-xs text-dark-400">Organization</span>
                <div className="mt-1 text-white flex items-center gap-2">
                  <Building size={14} className="text-dark-400" />
                  {user?.organization_name || '-'}
                </div>
              </div>
            </div>
          </Card>

          {/* Subscription */}
          {subscriptionStatus ? (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard size={16} />
                Subscription
              </h3>
              
              <div className={`p-3 rounded-lg ${subscriptionStatus.bg}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${subscriptionStatus.color}`}>
                    {subscriptionStatus.status === 'expired' ? (
                      <AlertTriangle size={14} className="inline mr-1" />
                    ) : (
                      <CheckCircle size={14} className="inline mr-1" />
                    )}
                    {subscriptionStatus.text}
                  </span>
                </div>
                <div className="text-xs text-dark-400 mt-2">
                  Expires: {new Date(user?.subscription_end || '').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              
              <Link
                to="/app/activate"
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors text-sm font-medium"
              >
                <Key size={16} />
                Renew with License Key
              </Link>
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard size={16} />
                Subscription
              </h3>
              
              <div className="p-3 rounded-lg bg-dark-700/50">
                <p className="text-sm text-dark-400">No subscription yet</p>
              </div>
              
              <Link
                to="/app/activate"
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Key size={16} />
                Activate License Key
              </Link>
            </Card>
          )}

          {/* Account Info */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={16} />
              Account Info
            </h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-dark-400">Account Created</span>
                <div className="text-white">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '-'}
                </div>
              </div>
              
              <div>
                <span className="text-dark-400">Last Login</span>
                <div className="text-white">
                  {user?.last_login_at ? new Date(user.last_login_at).toLocaleString('en-US') : '-'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
