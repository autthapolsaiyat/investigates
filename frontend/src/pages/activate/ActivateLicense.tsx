/**
 * Activate License Page
 * User interface for activating license keys
 */
import { useState, useEffect } from 'react';
import { 
  Key, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Shield,
  Sparkles,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

interface SubscriptionInfo {
  has_subscription: boolean;
  plan_type?: string;
  plan_name?: string;
  subscription_start?: string;
  subscription_end?: string;
  days_remaining: number;
  is_expired: boolean;
  features: string[];
  last_license_key?: string;
  last_activated_at?: string;
}

interface ActivationResult {
  message: string;
  license_key: string;
  plan_type: string;
  plan_name: string;
  days_added: number;
  subscription_end: string;
  features: string[];
}

interface ValidationResult {
  valid: boolean;
  status?: string;
  plan_type?: string;
  plan_name?: string;
  days_valid?: number;
  message: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://investigates-api.azurewebsites.net/api/v1';

export const ActivateLicense = () => {
  const { checkAuth } = useAuthStore();
  const [licenseKey, setLicenseKey] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  });

  // Fetch current subscription
  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/licenses/my/subscription`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format license key as user types (INVG-XXXX-XXXX-XXXX)
  const handleKeyInput = (value: string) => {
    // Remove all non-alphanumeric except dash
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    
    // Auto-format
    let formatted = cleaned;
    if (cleaned.length > 4 && !cleaned.startsWith('INVG-')) {
      // If user didn't start with INVG-, try to format
      const parts = cleaned.replace(/-/g, '').match(/.{1,4}/g) || [];
      formatted = parts.join('-');
    }
    
    setLicenseKey(formatted.substring(0, 19)); // Max length INVG-XXXX-XXXX-XXXX
    setValidation(null);
    setError(null);
  };

  // Validate key before activation
  const handleValidate = async () => {
    if (licenseKey.length !== 19) {
      setError('Please enter complete License Key (INVG-XXXX-XXXX-XXXX)');
      return;
    }
    
    setIsValidating(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/licenses/validate/${licenseKey}`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      setValidation(data);
      
      if (!data.valid) {
        setError(data.message);
      }
    } catch (error) {
      setError('Cannot verify License Key');
    } finally {
      setIsValidating(false);
    }
  };

  // Activate license
  const handleActivate = async () => {
    setIsActivating(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/licenses/activate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ license_key: licenseKey })
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivationResult(data);
        setLicenseKey('');
        setValidation(null);
        
        // Refresh subscription info
        fetchSubscription();
        
        // Refresh user auth data
        checkAuth();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Cannot activate License');
      }
    } catch (error) {
      setError('An error occurred. Please try again');
    } finally {
      setIsActivating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSubscriptionStatus = () => {
    if (!subscription?.has_subscription) return null;
    
    if (subscription.is_expired) {
      return { 
        color: 'text-red-400', 
        bg: 'bg-red-500/10', 
        border: 'border-red-500/20',
        icon: XCircle, 
        text: 'Expired' 
      };
    }
    
    if (subscription.days_remaining <= 7) {
      return { 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-500/10', 
        border: 'border-yellow-500/20',
        icon: AlertTriangle, 
        text: `remaining ${subscription.days_remaining} days` 
      };
    }
    
    return { 
      color: 'text-green-400', 
      bg: 'bg-green-500/10', 
      border: 'border-green-500/20',
      icon: CheckCircle, 
      text: `remaining ${subscription.days_remaining} days` 
    };
  };

  const status = getSubscriptionStatus();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Key size={24} />
          Activate License
        </h1>
        <p className="text-dark-400 mt-1">Enter License Key to renew subscription</p>
      </div>

      {/* Current Subscription Status */}
      {isLoading ? (
        <Card className="p-6">
          <div className="flex items-center justify-center gap-2 text-dark-400">
            <RefreshCw className="animate-spin" size={20} />
            Loading...
          </div>
        </Card>
      ) : subscription?.has_subscription ? (
        <Card className={`p-6 ${status?.bg} border ${status?.border}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${status?.bg}`}>
              {status?.icon && <status.icon size={24} className={status?.color} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">
                  {subscription.plan_name || 'Subscription'}
                </h3>
                <span className={`text-sm font-medium ${status?.color}`}>
                  {status?.text}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-dark-400">Start</p>
                  <p className="text-white">
                    {subscription.subscription_start ? formatDate(subscription.subscription_start) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-400">Expiry</p>
                  <p className="text-white">
                    {subscription.subscription_end ? formatDate(subscription.subscription_end) : '-'}
                  </p>
                </div>
              </div>
              
              {subscription.features && subscription.features.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-dark-400 mb-2">Features</p>
                  <div className="flex flex-wrap gap-2">
                    {subscription.features.map((feature, idx) => (
                      <span key={idx} className="px-2 py-1 bg-dark-700 rounded text-xs text-dark-300">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-dark-800/50 border border-dark-700">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-dark-700">
              <CreditCard size={24} className="text-dark-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">No Subscription Yet</h3>
              <p className="text-dark-400 text-sm">Enter License Key below to activate</p>
            </div>
          </div>
        </Card>
      )}

      {/* Activation Success */}
      {activationResult && (
        <Card className="p-6 bg-green-500/10 border border-green-500/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-green-500/20">
              <Sparkles size={24} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400">ActivateSuccess!</h3>
              <p className="text-dark-300 mt-1">{activationResult.message}</p>
              
              <div className="mt-4 p-3 bg-dark-800/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-dark-400">Package</p>
                    <p className="text-white font-medium">{activationResult.plan_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400">Added Duration</p>
                    <p className="text-white font-medium">{activationResult.days_added} days</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-dark-400">Valid until</p>
                    <p className="text-white font-medium">{formatDate(activationResult.subscription_end)}</p>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                className="mt-4"
                onClick={() => setActivationResult(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* License Key Input */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Key size={20} />
          Enter License Key
        </h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-2">License Key</label>
            <Input
              value={licenseKey}
              onChange={(e) => handleKeyInput(e.target.value)}
              placeholder="INVG-XXXX-XXXX-XXXX"
              className="font-mono text-lg tracking-wider text-center"
              maxLength={19}
            />
            <p className="text-xs text-dark-500 mt-1">Format: INVG-XXXX-XXXX-XXXX</p>
          </div>
          
          {/* Validation Result */}
          {validation && validation.valid && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <CheckCircle size={18} />
                <span className="font-medium">License Key is valid</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-xs text-dark-400">Package</p>
                  <p className="text-white">{validation.plan_name}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400">Duration</p>
                  <p className="text-white">{validation.days_valid} days</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleValidate}
              disabled={licenseKey.length !== 19 || isValidating}
              className="flex-1"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="animate-spin mr-2" size={16} />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield size={16} className="mr-2" />
                  Verify Key
                </>
              )}
            </Button>
            
            <Button
              onClick={handleActivate}
              disabled={!validation?.valid || isActivating}
              className="flex-1"
            >
              {isActivating ? (
                <>
                  <RefreshCw className="animate-spin mr-2" size={16} />
                  LoadingActivate...
                </>
              ) : (
                <>
                  <Key size={16} className="mr-2" />
                  Activate
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Help */}
      <Card className="p-6 bg-dark-800/30">
        <h4 className="font-medium text-white mb-3">How to Get License Key</h4>
        <ol className="text-sm text-dark-400 space-y-2 list-decimal list-inside">
          <li>Contact sales team via LINE or designated channels</li>
          <li>Select desired package (Basic / Professional / Enterprise)</li>
          <li>Make payment via specified channels</li>
          <li>Receive License Key via LINE or email</li>
          <li>Enter Key on this page to activate</li>
        </ol>
        
        <div className="mt-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
          <p className="text-sm text-primary-400">
            <strong>Contact:</strong> LINE: @investigateplatform
          </p>
        </div>
      </Card>
    </div>
  );
};
