/**
 * NodeDetailPanel - Detailed information panel for selected node
 * Shows all node properties and related transactions
 */
import { 
  X, 
  Copy, 
  ExternalLink,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Shield,

  Hash,
  Building2,
  FileText
} from 'lucide-react';
import type { MoneyFlowNode, MoneyFlowEdge } from './types';

interface NodeDetailPanelProps {
  node: MoneyFlowNode;
  edges: MoneyFlowEdge[];
  onClose: () => void;
}

export const NodeDetailPanel = ({ node, edges, onClose }: NodeDetailPanelProps) => {
  // Get incoming and outgoing transactions
  const incomingEdges = edges.filter(e => e.to_node_id === node.id);
  const outgoingEdges = edges.filter(e => e.from_node_id === node.id);
  
  const totalIn = incomingEdges.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalOut = outgoingEdges.reduce((sum, e) => sum + (e.amount || 0), 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`;
  };

  const getRiskColor = (score: number = 0) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-amber-400';
    if (score >= 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskBg = (score: number = 0) => {
    if (score >= 70) return 'bg-red-500/20 border-red-500/30';
    if (score >= 40) return 'bg-amber-500/20 border-amber-500/30';
    if (score >= 20) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-green-500/20 border-green-500/30';
  };

  return (
    <div className="bg-dark-800/95 backdrop-blur-sm border border-dark-600 rounded-xl shadow-xl w-80 max-h-[500px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-600">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText size={16} className="text-primary-400" />
          รายละเอียด Node
        </h3>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-dark-700 rounded transition-colors"
        >
          <X size={16} className="text-dark-400" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status Badges */}
        <div className="flex gap-2">
          {node.is_suspect && (
            <span className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle size={12} />
              ผู้ต้องสงสัย
            </span>
          )}
          {node.is_victim && (
            <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs text-cyan-400 flex items-center gap-1">
              <Shield size={12} />
              ผู้เสียหาย
            </span>
          )}
        </div>

        {/* Main Info */}
        <div className="space-y-3">
          {/* Label */}
          <div>
            <label className="text-xs text-dark-400">ชื่อ</label>
            <p className="text-sm text-white font-medium">{node.label}</p>
          </div>

          {/* Identifier */}
          {node.identifier && (
            <div>
              <label className="text-xs text-dark-400 flex items-center gap-1">
                <Hash size={10} />
                Identifier
              </label>
              <div className="flex items-center gap-2">
                <code className="text-xs text-primary-400 bg-dark-900 px-2 py-1 rounded truncate max-w-[200px]">
                  {node.identifier}
                </code>
                <button 
                  onClick={() => copyToClipboard(node.identifier || '')}
                  className="p-1 hover:bg-dark-700 rounded"
                >
                  <Copy size={12} className="text-dark-400" />
                </button>
              </div>
            </div>
          )}

          {/* Bank/Institution */}
          {node.bank_name && (
            <div>
              <label className="text-xs text-dark-400 flex items-center gap-1">
                <Building2 size={10} />
                สถาบัน/ธนาคาร
              </label>
              <p className="text-sm text-white">{node.bank_name}</p>
            </div>
          )}

          {/* Account Name */}
          {node.account_name && (
            <div>
              <label className="text-xs text-dark-400">ชื่อบัญชี</label>
              <p className="text-sm text-white">{node.account_name}</p>
            </div>
          )}

          {/* Node Type */}
          <div>
            <label className="text-xs text-dark-400">ประเภท</label>
            <p className="text-sm text-white capitalize">
              {node.node_type === 'bank_account' ? 'บัญชีธนาคาร' :
               node.node_type === 'crypto_wallet' ? 'Crypto Wallet' :
               node.node_type === 'person' ? 'บุคคล' :
               node.node_type === 'company' ? 'บริษัท' :
               node.node_type === 'exchange' ? 'Exchange' : node.node_type}
            </p>
          </div>
        </div>

        {/* Risk Score */}
        {(node.risk_score !== undefined && node.risk_score > 0) && (
          <div className={`p-3 rounded-lg border ${getRiskBg(node.risk_score)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-dark-300">ระดับความเสี่ยง</span>
              <span className={`text-lg font-bold ${getRiskColor(node.risk_score)}`}>
                {node.risk_score}
              </span>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${node.risk_score}%`,
                  backgroundColor: node.risk_score >= 70 ? '#EF4444' : 
                                   node.risk_score >= 40 ? '#F59E0B' : '#10B981'
                }}
              />
            </div>
          </div>
        )}

        {/* Transaction Summary */}
        <div className="grid grid-cols-2 gap-3">
          {/* Incoming */}
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-1 text-green-400 mb-1">
              <ArrowDownLeft size={14} />
              <span className="text-xs">รับเข้า</span>
            </div>
            <p className="text-sm font-semibold text-white">
              {formatCurrency(totalIn)}
            </p>
            <p className="text-xs text-dark-400">
              {incomingEdges.length} รายการ
            </p>
          </div>

          {/* Outgoing */}
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-1 text-red-400 mb-1">
              <ArrowUpRight size={14} />
              <span className="text-xs">ส่งออก</span>
            </div>
            <p className="text-sm font-semibold text-white">
              {formatCurrency(totalOut)}
            </p>
            <p className="text-xs text-dark-400">
              {outgoingEdges.length} รายการ
            </p>
          </div>
        </div>

        {/* Notes */}
        {node.notes && (
          <div>
            <label className="text-xs text-dark-400">หมายเหตุ</label>
            <p className="text-sm text-dark-300 bg-dark-900 p-2 rounded mt-1">
              {node.notes}
            </p>
          </div>
        )}

        {/* Recent Transactions */}
        {(incomingEdges.length > 0 || outgoingEdges.length > 0) && (
          <div>
            <label className="text-xs text-dark-400 mb-2 block">ธุรกรรมล่าสุด</label>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {[...incomingEdges, ...outgoingEdges].slice(0, 5).map((edge, i) => (
                <div 
                  key={edge.id || i}
                  className="flex items-center justify-between p-2 bg-dark-900 rounded text-xs"
                >
                  <div className="flex items-center gap-2">
                    {edge.to_node_id === node.id ? (
                      <ArrowDownLeft size={12} className="text-green-400" />
                    ) : (
                      <ArrowUpRight size={12} className="text-red-400" />
                    )}
                    <span className="text-dark-300 truncate max-w-[100px]">
                      {edge.label || 'Transfer'}
                    </span>
                  </div>
                  <span className={`font-medium ${
                    edge.to_node_id === node.id ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {edge.to_node_id === node.id ? '+' : '-'}{formatCurrency(edge.amount || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-dark-600 flex gap-2">
        <button className="flex-1 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1">
          <ExternalLink size={12} />
          ดูรายละเอียดเพิ่มเติม
        </button>
      </div>
    </div>
  );
};

export default NodeDetailPanel;
