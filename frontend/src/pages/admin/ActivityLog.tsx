/**
 * Activity Log Page (Admin)
 * View system activity logs
 */
import { useState } from 'react';
import { Activity, Search, Filter, RefreshCw, User, Clock } from 'lucide-react';
import { Card, Input, Button } from '../../components/ui';

export const ActivityLog = () => {
  const [search, setSearch] = useState('');

  // Mock activity data - will be replaced with real API
  const activities = [
    { id: 1, user: 'admin@test.com', action: 'Login', details: 'เข้าสู่ระบบสำเร็จ', timestamp: new Date().toISOString(), type: 'auth' },
    { id: 2, user: 'investigator@test.com', action: 'Create Case', details: 'สร้างคดี CASE-001', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'case' },
    { id: 3, user: 'admin@test.com', action: 'Approve Registration', details: 'อนุมัติผู้ใช้ใหม่', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'admin' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-7 h-7 text-primary-400" />
            Activity Log
          </h1>
          <p className="text-gray-400 mt-1">บันทึกกิจกรรมในระบบ</p>
        </div>
        <Button variant="secondary">
          <RefreshCw className="w-4 h-4 mr-2" />
          รีเฟรช
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="ค้นหากิจกรรม..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white">
              <option value="">ทุกประเภท</option>
              <option value="auth">Authentication</option>
              <option value="case">Cases</option>
              <option value="admin">Admin Actions</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Activity List */}
      <Card>
        <div className="divide-y divide-dark-700">
          {activities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-dark-800/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-dark-700 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">{activity.user}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-primary-400">{activity.action}</span>
                  </div>
                  <p className="text-sm text-gray-400">{activity.details}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(activity.timestamp).toLocaleString('th-TH')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Coming Soon Notice */}
      <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg text-center">
        <p className="text-primary-400">🚧 ฟีเจอร์นี้กำลังพัฒนา - จะเชื่อมต่อกับ API จริงในเร็วๆ นี้</p>
      </div>
    </div>
  );
};

export { ActivityLog as ActivityLogPage };
