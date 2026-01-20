/**
 * System Reports Page (Admin)
 * View system statistics and generate reports
 */
import { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { Card, Button } from '../../components/ui';

export const SystemReports = () => {
  const [dateRange, setDateRange] = useState('7d');
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data
  const usageStats = {
    totalLogins: 1250,
    uniqueUsers: 45,
    casesCreated: 23,
    reportsGenerated: 89,
    avgSessionTime: '24 นาที',
  };

  const topFeatures = [
    { name: 'Money Flow Analysis', usage: 456, percentage: 35 },
    { name: 'Forensic Report', usage: 312, percentage: 24 },
    { name: 'Smart Import', usage: 234, percentage: 18 },
    { name: 'Call Analysis', usage: 156, percentage: 12 },
    { name: 'Location Timeline', usage: 142, percentage: 11 },
  ];

  const reportTypes = [
    { id: 'usage', name: 'รายงานการใช้งาน', description: 'สถิติการเข้าใช้งานและฟีเจอร์', icon: BarChart3 },
    { id: 'users', name: 'รายงานผู้ใช้', description: 'จำนวนผู้ใช้, Registration, Subscription', icon: Users },
    { id: 'cases', name: 'รายงานคดี', description: 'สถิติคดีและการวิเคราะห์', icon: Briefcase },
    { id: 'financial', name: 'รายงานการเงิน', description: 'รายได้และ Subscription', icon: DollarSign },
  ];

  const handleGenerateReport = (type: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert(`รายงาน ${type} พร้อมดาวน์โหลด (Mock)`);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary-400" />
            System Reports
          </h1>
          <p className="text-gray-400 mt-1">สถิติและรายงานระบบ</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
          >
            <option value="7d">7 วันล่าสุด</option>
            <option value="30d">30 วันล่าสุด</option>
            <option value="90d">90 วันล่าสุด</option>
            <option value="1y">1 ปี</option>
          </select>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-white">{usageStats.totalLogins}</p>
          <p className="text-sm text-gray-400">Total Logins</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-white">{usageStats.uniqueUsers}</p>
          <p className="text-sm text-gray-400">Unique Users</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-white">{usageStats.casesCreated}</p>
          <p className="text-sm text-gray-400">Cases Created</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-white">{usageStats.reportsGenerated}</p>
          <p className="text-sm text-gray-400">Reports Generated</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-white">{usageStats.avgSessionTime}</p>
          <p className="text-sm text-gray-400">Avg. Session</p>
        </Card>
      </div>

      {/* Feature Usage */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          ฟีเจอร์ที่ใช้มากที่สุด
        </h2>
        <div className="space-y-4">
          {topFeatures.map((feature, index) => (
            <div key={feature.name} className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-4">{index + 1}.</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white">{feature.name}</span>
                  <span className="text-sm text-gray-400">{feature.usage} ครั้ง ({feature.percentage}%)</span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all"
                    style={{ width: `${feature.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Generate Reports */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary-400" />
          สร้างรายงาน
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              className="p-4 bg-dark-800 rounded-lg border border-dark-700"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <report.icon className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{report.name}</h3>
                  <p className="text-xs text-gray-400">{report.description}</p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => handleGenerateReport(report.name)}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    ดาวน์โหลด
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Coming Soon Notice */}
      <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg text-center">
        <p className="text-primary-400">🚧 ระบบรายงานกำลังพัฒนา - ข้อมูลเป็น Mock Data</p>
      </div>
    </div>
  );
};

export { SystemReports as SystemReportsPage };
