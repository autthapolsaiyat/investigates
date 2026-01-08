import { Card, Badge } from '../../components/ui';
import { FolderOpen, Users, DollarSign, AlertTriangle, ArrowUpRight } from 'lucide-react';

export const DashboardPage = () => {
  const stats = [
    { title: 'Total Cases', value: 156, icon: FolderOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', change: '+12%' },
    { title: 'Suspects', value: 342, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10', change: '+8%' },
    { title: 'Transactions', value: '1.2M', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', change: '+24%' },
    { title: 'Flagged', value: 89, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', change: '-5%' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-dark-400">ภาพรวมระบบ InvestiGate</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-400 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">{stat.change}</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4">Recent Cases</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium">CASE-202601-ABC{i}</p>
                    <p className="text-sm text-dark-400">คดีสืบสวน #{i}</p>
                  </div>
                </div>
                <Badge variant={i === 1 ? 'danger' : i === 2 ? 'warning' : 'success'}>
                  {i === 1 ? 'Critical' : i === 2 ? 'High' : 'Medium'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {['New case created', 'Evidence uploaded', 'Suspect identified', 'Transaction flagged'].map((action, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary-500" />
                <div>
                  <p className="text-sm">{action}</p>
                  <p className="text-xs text-dark-500">{i + 1} hour ago</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
