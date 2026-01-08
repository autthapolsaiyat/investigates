import { useState } from 'react';
import { Card, Button, Badge } from '../../components/ui';
import { Plus, Search, FolderOpen } from 'lucide-react';

const mockCases = [
  { id: 1, case_number: 'CASE-202601-A001', title: 'คดีพนันออนไลน์ ABC Casino', status: 'investigating', priority: 'critical', type: 'gambling' },
  { id: 2, case_number: 'CASE-202601-D002', title: 'คดียาเสพติดเครือข่าย XYZ', status: 'open', priority: 'high', type: 'drug' },
  { id: 3, case_number: 'CASE-202601-F003', title: 'คดีฉ้อโกงออนไลน์', status: 'legal', priority: 'medium', type: 'fraud' },
];

export const CasesPage = () => {
  const [search, setSearch] = useState('');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cases</h1>
          <p className="text-dark-400">จัดการคดีทั้งหมด</p>
        </div>
        <Button><Plus size={18} /> New Case</Button>
      </div>

      <div className="mb-6">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            placeholder="Search cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-800/50 text-dark-400 text-xs uppercase">
              <th className="text-left p-4">Case</th>
              <th className="text-left p-4">Type</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Priority</th>
            </tr>
          </thead>
          <tbody>
            {mockCases.map((c) => (
              <tr key={c.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium">{c.case_number}</p>
                      <p className="text-sm text-dark-400">{c.title}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 capitalize">{c.type}</td>
                <td className="p-4"><Badge variant="info">{c.status}</Badge></td>
                <td className="p-4">
                  <Badge variant={c.priority === 'critical' ? 'danger' : c.priority === 'high' ? 'warning' : 'default'}>
                    {c.priority}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
