/**
 * Admin API Keys Management
 * Manage external API keys for blockchain services (Chainalysis, Etherscan, etc.)
 */
import { useState, useEffect } from 'react';
import { 
  Key, Shield, CheckCircle, XCircle, Eye, EyeOff, 
  Save, Loader2, RefreshCw, ExternalLink, AlertTriangle,
  Coins, Search, Activity
} from 'lucide-react';
import { Button, Card, Input } from '../../components/ui';

const API_BASE = import.meta.env.VITE_API_URL || 'https://investigates-api.azurewebsites.net/api/v1';

interface ApiKeyConfig {
  id: string;
  name: string;
  description: string;
  provider: string;
  docUrl: string;
  envKey: string;
  category: 'blockchain' | 'sanctions' | 'analytics';
  isFree: boolean;
  value: string;
  isSet: boolean;
  lastTested: string | null;
  status: 'active' | 'invalid' | 'unknown';
}

const defaultApiKeys: ApiKeyConfig[] = [
  {
    id: 'chainalysis_sanctions',
    name: 'Chainalysis Sanctions API',
    description: 'OFAC sanctions screening for crypto wallets (FREE)',
    provider: 'Chainalysis',
    docUrl: 'https://www.chainalysis.com/free-cryptocurrency-sanctions-screening-tools/',
    envKey: 'CHAINALYSIS_SANCTIONS_API_KEY',
    category: 'sanctions',
    isFree: true,
    value: '',
    isSet: false,
    lastTested: null,
    status: 'unknown'
  },
  {
    id: 'chainalysis_kyt',
    name: 'Chainalysis KYT API',
    description: 'Know Your Transaction - Real-time risk scoring (PAID)',
    provider: 'Chainalysis',
    docUrl: 'https://www.chainalysis.com/chainalysis-kyt/',
    envKey: 'CHAINALYSIS_KYT_API_KEY',
    category: 'analytics',
    isFree: false,
    value: '',
    isSet: false,
    lastTested: null,
    status: 'unknown'
  },
  {
    id: 'etherscan',
    name: 'Etherscan API',
    description: 'Ethereum blockchain data (FREE tier available)',
    provider: 'Etherscan',
    docUrl: 'https://etherscan.io/apis',
    envKey: 'ETHERSCAN_API_KEY',
    category: 'blockchain',
    isFree: true,
    value: '',
    isSet: false,
    lastTested: null,
    status: 'unknown'
  },
  {
    id: 'blockchair',
    name: 'Blockchair API',
    description: 'Bitcoin & multi-chain data (FREE tier available)',
    provider: 'Blockchair',
    docUrl: 'https://blockchair.com/api',
    envKey: 'BLOCKCHAIR_API_KEY',
    category: 'blockchain',
    isFree: true,
    value: '',
    isSet: false,
    lastTested: null,
    status: 'unknown'
  }
];

export const ApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>(defaultApiKeys);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch current API key status
  useEffect(() => {
    fetchApiKeyStatus();
  }, []);

  const fetchApiKeyStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/admin/api-keys/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update apiKeys with server status
        setApiKeys(prev => prev.map(key => ({
          ...key,
          isSet: data[key.envKey]?.isSet || false,
          status: data[key.envKey]?.status || 'unknown',
          lastTested: data[key.envKey]?.lastTested || null
        })));
      }
    } catch (err) {
      console.error('Failed to fetch API key status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async (keyId: string) => {
    const key = apiKeys.find(k => k.id === keyId);
    if (!key || !tempValue.trim()) return;

    setSaving(keyId);
    setMessage(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/admin/api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key_name: key.envKey,
          key_value: tempValue.trim()
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `${key.name} saved successfully!` });
        setApiKeys(prev => prev.map(k => 
          k.id === keyId ? { ...k, isSet: true, status: 'unknown', value: '' } : k
        ));
        setEditingKey(null);
        setTempValue('');
        // Refresh status
        setTimeout(fetchApiKeyStatus, 1000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Failed to save API key' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(null);
    }
  };

  const handleTestKey = async (keyId: string) => {
    const key = apiKeys.find(k => k.id === keyId);
    if (!key) return;

    setTesting(keyId);
    setMessage(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/admin/api-keys/test/${key.envKey}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage({ type: 'success', text: `${key.name} is working!` });
        setApiKeys(prev => prev.map(k => 
          k.id === keyId ? { ...k, status: 'active', lastTested: new Date().toISOString() } : k
        ));
      } else {
        setMessage({ type: 'error', text: data.message || 'API key test failed' });
        setApiKeys(prev => prev.map(k => 
          k.id === keyId ? { ...k, status: 'invalid', lastTested: new Date().toISOString() } : k
        ));
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to test API key' });
    } finally {
      setTesting(null);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    const key = apiKeys.find(k => k.id === keyId);
    if (!key || !confirm(`Are you sure you want to delete ${key.name}?`)) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/admin/api-keys/${key.envKey}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `${key.name} deleted` });
        setApiKeys(prev => prev.map(k => 
          k.id === keyId ? { ...k, isSet: false, status: 'unknown' } : k
        ));
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete API key' });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sanctions': return <Shield className="w-5 h-5 text-red-400" />;
      case 'blockchain': return <Coins className="w-5 h-5 text-yellow-400" />;
      case 'analytics': return <Activity className="w-5 h-5 text-blue-400" />;
      default: return <Key className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string, isSet: boolean) => {
    if (!isSet) {
      return (
        <span className="flex items-center gap-1 text-dark-400 text-sm">
          <XCircle size={14} />
          Not configured
        </span>
      );
    }
    
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-green-400 text-sm">
            <CheckCircle size={14} />
            Active
          </span>
        );
      case 'invalid':
        return (
          <span className="flex items-center gap-1 text-red-400 text-sm">
            <XCircle size={14} />
            Invalid
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-yellow-400 text-sm">
            <AlertTriangle size={14} />
            Not tested
          </span>
        );
    }
  };

  const groupedKeys = {
    sanctions: apiKeys.filter(k => k.category === 'sanctions'),
    blockchain: apiKeys.filter(k => k.category === 'blockchain'),
    analytics: apiKeys.filter(k => k.category === 'analytics')
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Key className="w-7 h-7 text-primary-400" />
            API Keys Management
          </h1>
          <p className="text-dark-400 mt-1">
            Configure external API keys for blockchain data and sanctions screening
          </p>
        </div>
        <Button 
          variant="ghost" 
          onClick={fetchApiKeyStatus}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Sanctions Screening */}
      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-red-400" />
          Sanctions Screening
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded ml-2">FREE</span>
        </h2>
        <div className="space-y-4">
          {groupedKeys.sanctions.map(key => (
            <div key={key.id} className="bg-dark-800 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{key.name}</h3>
                    {key.isFree && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">FREE</span>
                    )}
                  </div>
                  <p className="text-sm text-dark-400 mb-2">{key.description}</p>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(key.status, key.isSet)}
                    <a 
                      href={key.docUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary-400 hover:underline flex items-center gap-1"
                    >
                      Get API Key <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {key.isSet && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestKey(key.id)}
                        disabled={testing === key.id}
                      >
                        {testing === key.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Search size={14} />
                        )}
                        Test
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  {!key.isSet && editingKey !== key.id && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditingKey(key.id);
                        setTempValue('');
                      }}
                    >
                      <Key size={14} />
                      Add Key
                    </Button>
                  )}
                </div>
              </div>

              {/* Edit Mode */}
              {editingKey === key.id && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type={showKey[key.id] ? 'text' : 'password'}
                        placeholder="Enter API key..."
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                      >
                        {showKey[key.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => handleSaveKey(key.id)}
                      disabled={!tempValue.trim() || saving === key.id}
                    >
                      {saving === key.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingKey(null);
                        setTempValue('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Blockchain Data */}
      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-yellow-400" />
          Blockchain Data Providers
        </h2>
        <div className="space-y-4">
          {groupedKeys.blockchain.map(key => (
            <div key={key.id} className="bg-dark-800 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{key.name}</h3>
                    {key.isFree && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">FREE</span>
                    )}
                  </div>
                  <p className="text-sm text-dark-400 mb-2">{key.description}</p>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(key.status, key.isSet)}
                    <a 
                      href={key.docUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary-400 hover:underline flex items-center gap-1"
                    >
                      Get API Key <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {key.isSet ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestKey(key.id)}
                        disabled={testing === key.id}
                      >
                        {testing === key.id ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        Test
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-400"
                      >
                        Delete
                      </Button>
                    </>
                  ) : editingKey !== key.id ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditingKey(key.id);
                        setTempValue('');
                      }}
                    >
                      <Key size={14} />
                      Add Key
                    </Button>
                  ) : null}
                </div>
              </div>

              {editingKey === key.id && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type={showKey[key.id] ? 'text' : 'password'}
                        placeholder="Enter API key..."
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                      >
                        {showKey[key.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => handleSaveKey(key.id)}
                      disabled={!tempValue.trim() || saving === key.id}
                    >
                      {saving === key.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Save
                    </Button>
                    <Button variant="ghost" onClick={() => { setEditingKey(null); setTempValue(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Analytics (Paid) */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-400" />
          Advanced Analytics
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded ml-2">PAID</span>
        </h2>
        <div className="space-y-4">
          {groupedKeys.analytics.map(key => (
            <div key={key.id} className="bg-dark-800 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{key.name}</h3>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">PAID</span>
                  </div>
                  <p className="text-sm text-dark-400 mb-2">{key.description}</p>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(key.status, key.isSet)}
                    <a 
                      href={key.docUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary-400 hover:underline flex items-center gap-1"
                    >
                      Contact Sales <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {key.isSet ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestKey(key.id)}
                        disabled={testing === key.id}
                      >
                        {testing === key.id ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        Test
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-400"
                      >
                        Delete
                      </Button>
                    </>
                  ) : editingKey !== key.id ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditingKey(key.id);
                        setTempValue('');
                      }}
                    >
                      <Key size={14} />
                      Add Key
                    </Button>
                  ) : null}
                </div>
              </div>

              {editingKey === key.id && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type={showKey[key.id] ? 'text' : 'password'}
                        placeholder="Enter API key..."
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                      >
                        {showKey[key.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => handleSaveKey(key.id)}
                      disabled={!tempValue.trim() || saving === key.id}
                    >
                      {saving === key.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Save
                    </Button>
                    <Button variant="ghost" onClick={() => { setEditingKey(null); setTempValue(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="font-medium text-blue-400 flex items-center gap-2 mb-2">
          <Shield size={16} />
          Security Note
        </h3>
        <p className="text-sm text-dark-300">
          API keys are encrypted and stored securely. They are never displayed after being saved.
          For Azure deployments, consider using Azure Key Vault for production environments.
        </p>
      </div>
    </div>
  );
};

export default ApiKeys;
