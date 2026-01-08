import { Card, Button } from '../../components/ui';
import { RefreshCw, Download, Filter } from 'lucide-react';

export const MoneyFlowPage = () => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">Money Flow</h1>
        <p className="text-dark-400">วิเคราะห์เส้นทางการเงิน</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm"><Filter size={16} /> Filter</Button>
        <Button variant="secondary" size="sm"><Download size={16} /> Export</Button>
        <Button size="sm"><RefreshCw size={16} /> Refresh</Button>
      </div>
    </div>

    <Card className="h-[500px] flex items-center justify-center">
      <div className="text-center text-dark-400">
        <p className="text-lg mb-2">Money Flow Graph</p>
        <p className="text-sm">เชื่อมต่อ Backend เพื่อดูกราฟ</p>
      </div>
    </Card>

    <div className="flex items-center gap-6 mt-4">
      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-sm text-dark-400">Suspect</span></div>
      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /><span className="text-sm text-dark-400">Mule</span></div>
      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-sm text-dark-400">Victim</span></div>
      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-sm text-dark-400">Exchange</span></div>
    </div>
  </div>
);
