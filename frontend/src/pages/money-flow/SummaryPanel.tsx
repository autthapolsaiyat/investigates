/**
 * SummaryPanel - Statistics summary for Money Flow
 * Shows total nodes, edges, flow amount, risk indicators
 */
import { 
  CircleDot, 
  ArrowRightLeft, 
  Banknote, 
  AlertTriangle,
  Shield,
  TrendingUp
} from 'lucide-react';

interface SummaryStats {
  nodeCount: number;
  edgeCount: number;
  totalFlow: number;
  suspectCount: number;
  victimCount: number;
  highRiskCount: number;
}

interface SummaryPanelProps {
  summary: SummaryStats;
}

export const SummaryPanel = ({ summary }: SummaryPanelProps) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `฿${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `฿${(amount / 1000).toFixed(1)}K`;
    }
    return `฿${amount.toLocaleString()}`;
  };

  return (
    <div className="bg-dark-800/95 backdrop-blur-sm border border-dark-600 rounded-xl p-4 shadow-xl min-w-[200px]">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <TrendingUp size={16} className="text-primary-400" />
        สรุปภาพรวม
      </h3>

      <div className="space-y-3">
        {/* Nodes */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-dark-300">
            <CircleDot size={14} className="text-blue-400" />
            <span className="text-xs">Nodes</span>
          </div>
          <span className="text-sm font-semibold text-white">
            {summary.nodeCount}
          </span>
        </div>

        {/* Edges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-dark-300">
            <ArrowRightLeft size={14} className="text-green-400" />
            <span className="text-xs">ธุรกรรม</span>
          </div>
          <span className="text-sm font-semibold text-white">
            {summary.edgeCount}
          </span>
        </div>

        {/* Total Flow */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-dark-300">
            <Banknote size={14} className="text-amber-400" />
            <span className="text-xs">มูลค่ารวม</span>
          </div>
          <span className="text-sm font-semibold text-amber-400">
            {formatCurrency(summary.totalFlow)}
          </span>
        </div>

        <div className="border-t border-dark-600 pt-3 mt-3">
          {/* Suspects */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-dark-300">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-xs">ผู้ต้องสงสัย</span>
            </div>
            <span className={`text-sm font-semibold ${summary.suspectCount > 0 ? 'text-red-400' : 'text-dark-500'}`}>
              {summary.suspectCount}
            </span>
          </div>

          {/* Victims */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-dark-300">
              <Shield size={14} className="text-cyan-400" />
              <span className="text-xs">ผู้เสียหาย</span>
            </div>
            <span className={`text-sm font-semibold ${summary.victimCount > 0 ? 'text-cyan-400' : 'text-dark-500'}`}>
              {summary.victimCount}
            </span>
          </div>

          {/* High Risk */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-dark-300">
              <AlertTriangle size={14} className="text-orange-400" />
              <span className="text-xs">ความเสี่ยงสูง</span>
            </div>
            <span className={`text-sm font-semibold ${summary.highRiskCount > 0 ? 'text-orange-400' : 'text-dark-500'}`}>
              {summary.highRiskCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;
