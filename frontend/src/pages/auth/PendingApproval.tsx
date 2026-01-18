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
      setError('ไม่พบอีเมลที่ต้องการตรวจสอบ');
      return;
    }

    setIsRefreshing(true);
    try {
      const data = await registrationAPI.checkStatus(email);
      setStatusData(data);
      setStatus(data.status);
      setError(null);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'ไม่สามารถตรวจสอบสถานะได้';
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
          title: 'กำลังตรวจสอบ...',
          description: 'กรุณารอสักครู่',
          color: 'blue',
        };
      case 'pending':
        return {
          icon: <Clock className="w-16 h-16 text-yellow-400" />,
          title: 'รอการอนุมัติ',
          description: 'คำขอลงทะเบียนของคุณกำลังรอการตรวจสอบจากผู้ดูแลระบบ',
          color: 'yellow',
        };
      case 'approved':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-400" />,
          title: 'อนุมัติแล้ว!',
          description: 'บัญชีของคุณพร้อมใช้งานแล้ว คุณสามารถเข้าสู่ระบบได้เลย',
          color: 'green',
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-16 h-16 text-red-400" />,
          title: 'ไม่อนุมัติ',
          description: statusData?.rejection_reason || 'คำขอลงทะเบียนของคุณถูกปฏิเสธ',
          color: 'red',
        };
      case 'error':
        return {
          icon: <XCircle className="w-16 h-16 text-red-400" />,
          title: 'เกิดข้อผิดพลาด',
          description: error || 'ไม่สามารถตรวจสอบสถานะได้',
          color: 'red',
        };
      default:
        return {
          icon: <Clock className="w-16 h-16 text-gray-400" />,
          title: 'ไม่ทราบสถานะ',
          description: 'กรุณาลองใหม่อีกครั้ง',
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
              ส่งคำขอเมื่อ: {new Date(statusData.created_at).toLocaleString('th-TH')}
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
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    ตรวจสอบสถานะ
                  </>
                )}
              </Button>
            )}

            {status === 'approved' && (
              <Link to="/login">
                <Button className="w-full">
                  เข้าสู่ระบบ
                </Button>
              </Link>
            )}

            {status === 'rejected' && (
              <Link to="/register">
                <Button variant="secondary" className="w-full">
                  สมัครใหม่
                </Button>
              </Link>
            )}

            <Link to="/">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                กลับหน้าแรก
              </Button>
            </Link>
          </div>
        </Card>

        {/* Tips for pending */}
        {status === 'pending' && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <h3 className="text-yellow-400 font-medium mb-2">💡 ขณะรอการอนุมัติ</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• ผู้ดูแลระบบจะตรวจสอบข้อมูลของคุณ</li>
              <li>• คุณจะได้รับการแจ้งเตือนทางอีเมลเมื่อมีการอนุมัติ</li>
              <li>• ระยะเวลาอนุมัติโดยทั่วไป 1-2 วันทำการ</li>
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
