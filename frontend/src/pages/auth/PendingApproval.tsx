/**
 * Pending Approval Page
 * Shown after registration, displays status
 */
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, RefreshCw, Mail, ArrowLeft } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { registrationAPI } from '../../services/api';
import type { RegistrationStatusCheck } from '../../services/api';

type StatusType = 'pending' | 'approved' | 'rejected' | 'loading' | 'error';

export default function PendingApproval() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [status, setStatus] = useState<StatusType>('loading');
  const [statusData, setStatusData] = useState<RegistrationStatusCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = async () => {
    if (!email) {
      setStatus('error');
      setError('Email not found');
      return;
    }

    setIsRefreshing(true);
    try {
      const data = await registrationAPI.checkStatus(email);
      setStatusData(data);
      setStatus(data.status);
      setError(null);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Cannot check status';
      setError(message);
      setStatus('error');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Auto-refresh every 30 seconds for pending status
    const interval = setInterval(() => {
      if (status === 'pending') {
        checkStatus();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [email]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <RefreshCw className="w-16 h-16 text-blue-400 animate-spin" />,
          title: 'Checking...',
          description: 'Please wait',
          color: 'blue',
        };
      case 'pending':
        return {
          icon: <Clock className="w-16 h-16 text-yellow-400" />,
          title: 'Pending Approval',
          description: 'Your registration is pending admin review',
          color: 'yellow',
        };
      case 'approved':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-400" />,
          title: 'Approved!',
          description: 'Your account is ready. You can login now',
          color: 'green',
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-16 h-16 text-red-400" />,
          title: 'Not Approved',
          description: statusData?.rejection_reason || 'Your registration was rejected',
          color: 'red',
        };
      case 'error':
        return {
          icon: <XCircle className="w-16 h-16 text-red-400" />,
          title: 'Error',
          description: error || 'Cannot check status',
          color: 'red',
        };
      default:
        return {
          icon: <Clock className="w-16 h-16 text-gray-400" />,
          title: 'Unknown Status',
          description: 'Please try again',
          color: 'gray',
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/images/logo.png" alt="InvestiGate" className="h-28 mx-auto mb-2" />
        </div>

        {/* Status Card */}
        <Card className="p-8 text-center">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {display.icon}
          </div>

          {/* Status Title */}
          <h1 className="text-2xl font-bold text-white mb-2">{display.title}</h1>
          
          {/* Status Description */}
          <p className="text-gray-400 mb-6">{display.description}</p>

          {/* Email Display */}
          {email && (
            <div className="flex items-center justify-center gap-2 p-3 bg-dark-800 rounded-lg mb-6">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-300">{email}</span>
            </div>
          )}

          {/* Timestamp */}
          {statusData?.created_at && (
            <p className="text-sm text-gray-500 mb-6">
              Submitted: {new Date(statusData.created_at).toLocaleString('en-US')}
            </p>
          )}

          {/* Actions based on status */}
          <div className="space-y-3">
            {status === 'pending' && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={checkStatus}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check Status
                  </>
                )}
              </Button>
            )}

            {status === 'approved' && (
              <Link to="/login">
                <Button className="w-full">
                  Login
                </Button>
              </Link>
            )}

            {status === 'rejected' && (
              <Link to="/register">
                <Button variant="secondary" className="w-full">
                  Register Again
                </Button>
              </Link>
            )}

            <Link to="/">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </Card>

        {/* Tips for pending */}
        {status === 'pending' && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <h3 className="text-yellow-400 font-medium mb-2">💡 While Pending Approval</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Admin will review your information</li>
              <li>• You will receive email notification upon approval</li>
              <li>• Typical approval time is 1-2 business days</li>
            </ul>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          &copy; 2024 InvestiGate. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export { PendingApproval as PendingApprovalPage };
