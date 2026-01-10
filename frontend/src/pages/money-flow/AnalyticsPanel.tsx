/**
 * AnalyticsPanel - Advanced analytics for Money Flow
 * Shows top transfers, flow analysis, and insights
 */
import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Trophy,
  PieChart,
  Search,
  X,
  AlertTriangle,
  Building2,
  Wallet
} from 'lucide-react';
import type { MoneyFlowNode, MoneyFlowEdge } from './types';

// Known entities database
const KNOWN_ENTITIES: Record<string, { name: string; type: string; risk: 'low' | 'medium' | 'high' }> = {
  '0x28c6c06298d514db089934071355e5743bf21d60': { name: 'Binance Hot Wallet', type: 'Exchange', risk: 'low' },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { name: 'Binance Cold Wallet', type: 'Exchange', risk: 'low' },
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': { name: 'Binance Hot Wallet 2', type: 'Exchange', risk: 'low' },
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f': { name: 'Binance Hot Wallet 3', type: 'Exchange', risk: 'low' },
  '0x8589427373d6d84e98730d7795d8f6f8731fda16': { name: 'Tornado Cash', type: 'Mixer', risk: 'high' },
  '0x722122df12d4e14e13ac3b6895a86e84145b6967': { name: 'Tornado Cash Router', type: 'Mixer', risk: 'high' },
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name: 'Uniswap V2 Router', type: 'DEX', risk: 'low' },
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': { name: 'Uniswap V3 Router', type: 'DEX', risk: 'low' },
  '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad': { name: 'Uniswap Universal Router', type: 'DEX', risk: 'low' },
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { name: 'USDC Contract', type: 'Stablecoin', risk: 'low' },
  '0xdac17f958d2ee523a2206206994597c13d831ec7': { name: 'USDT Contract', type: 'Stablecoin', risk: 'low' },
};

interface AnalyticsPanelProps {
  nodes: MoneyFlowNode[];
  edges: MoneyFlowEdge[];
  onNodeSelect?: (nodeId: number) => void;
}

export const AnalyticsPanel = ({ nodes, edges, onNodeSelect }: AnalyticsPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'top' | 'flow' | 'entities'>('top');
  const [searchQuery, setSearchQuery] = useState('');

  // Get node label by ID
  const getNodeLabel = (nodeId: number) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.label || `Node ${nodeId}`;
  };

  // Get node identifier
  };

  // Top 10 transfers by amount
  const topTransfers = useMemo(() => {
    return [...edges]
      .filter(e => e.amount && e.amount > 0)
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 10);
  }, [edges]);

  // Flow analysis - where money goes most
  const flowAnalysis = useMemo(() => {
    const inflow = new Map<number, number>();
    const outflow = new Map<number, number>();

    edges.forEach(e => {
      // Outflow from source
      outflow.set(e.from_node_id, (outflow.get(e.from_node_id) || 0) + (e.amount || 0));
      // Inflow to target
      inflow.set(e.to_node_id, (inflow.get(e.to_node_id) || 0) + (e.amount || 0));
    });

    // Top receivers
    const topReceivers = Array.from(inflow.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nodeId, amount]) => ({ nodeId, amount, label: getNodeLabel(nodeId) }));

    // Top senders
    const topSenders = Array.from(outflow.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nodeId, amount]) => ({ nodeId, amount, label: getNodeLabel(nodeId) }));

    return { topReceivers, topSenders };
  }, [edges, nodes]);

  // Known entities in the graph
  const knownEntities = useMemo(() => {
    return nodes
      .filter(n => {
        const identifier = n.identifier?.toLowerCase();
        return identifier && KNOWN_ENTITIES[identifier];
      })
      .map(n => ({
        node: n,
        entity: KNOWN_ENTITIES[n.identifier!.toLowerCase()]
      }));
  }, [nodes]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return nodes.filter(n => 
      n.label.toLowerCase().includes(query) ||
      n.identifier?.toLowerCase().includes(query) ||
      n.bank_name?.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [nodes, searchQuery]);

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `฿${(amount / 1000).toFixed(1)}K`;
    return `฿${amount.toLocaleString()}`;
  };

  return (
    <div className="bg-dark-800/95 backdrop-blur-sm border border-dark-600 rounded-xl shadow-xl overflow-hidden w-80">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-dark-700 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <PieChart size={16} className="text-primary-400" />
          วิเคราะห์ข้อมูล
        </span>
        {isOpen ? <ChevronUp size={16} className="text-dark-400" /> : <ChevronDown size={16} className="text-dark-400" />}
      </button>

      {isOpen && (
        <div className="border-t border-dark-700">
          {/* Search */}
          <div className="p-3 border-b border-dark-700">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา Wallet..."
                className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-dark-700 rounded"
                >
                  <X size={12} className="text-dark-400" />
                </button>
              )}
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map(node => (
                  <button
                    key={node.id}
                    onClick={() => {
                      onNodeSelect?.(node.id);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-2 p-2 bg-dark-900 hover:bg-dark-700 rounded-lg text-left transition-colors"
                  >
                    <Wallet size={14} className="text-amber-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white truncate">{node.label}</div>
                      <div className="text-xs text-dark-400 truncate">{node.identifier?.slice(0, 20)}...</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-dark-700">
            <button
              onClick={() => setActiveTab('top')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'top' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-dark-400 hover:text-white'
              }`}
            >
              <Trophy size={12} className="inline mr-1" />
              Top 10
            </button>
            <button
              onClick={() => setActiveTab('flow')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'flow' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-dark-400 hover:text-white'
              }`}
            >
              <TrendingUp size={12} className="inline mr-1" />
              Flow
            </button>
            <button
              onClick={() => setActiveTab('entities')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'entities' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-dark-400 hover:text-white'
              }`}
            >
              <Building2 size={12} className="inline mr-1" />
              Entities
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[350px] overflow-y-auto">
            {/* Top Transfers Tab */}
            {activeTab === 'top' && (
              <div className="p-3 space-y-2">
                <div className="text-xs text-dark-400 mb-2">ธุรกรรมมูลค่าสูงสุด</div>
                {topTransfers.length === 0 ? (
                  <div className="text-center text-dark-500 text-sm py-4">ไม่มีข้อมูล</div>
                ) : (
                  topTransfers.map((edge, index) => (
                    <div
                      key={edge.id}
                      className="flex items-center gap-2 p-2 bg-dark-900 rounded-lg hover:bg-dark-700 cursor-pointer transition-colors"
                      onClick={() => onNodeSelect?.(edge.from_node_id)}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3 ? 'bg-amber-500 text-white' : 'bg-dark-700 text-dark-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-dark-300 truncate max-w-[80px]">{getNodeLabel(edge.from_node_id)}</span>
                          <ArrowRight size={10} className="text-dark-500 flex-shrink-0" />
                          <span className="text-dark-300 truncate max-w-[80px]">{getNodeLabel(edge.to_node_id)}</span>
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-amber-400">
                        {formatCurrency(edge.amount || 0)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Flow Analysis Tab */}
            {activeTab === 'flow' && (
              <div className="p-3 space-y-4">
                {/* Top Receivers */}
                <div>
                  <div className="text-xs text-dark-400 mb-2 flex items-center gap-1">
                    <TrendingDown size={12} className="text-green-400" />
                    รับเงินเข้ามากที่สุด
                  </div>
                  <div className="space-y-1">
                    {flowAnalysis.topReceivers.map((item, index) => (
                      <div
                        key={item.nodeId}
                        onClick={() => onNodeSelect?.(item.nodeId)}
                        className="flex items-center justify-between p-2 bg-dark-900 rounded-lg hover:bg-dark-700 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-dark-500">#{index + 1}</span>
                          <span className="text-xs text-white truncate max-w-[120px]">{item.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-green-400">+{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Senders */}
                <div>
                  <div className="text-xs text-dark-400 mb-2 flex items-center gap-1">
                    <TrendingUp size={12} className="text-red-400" />
                    ส่งเงินออกมากที่สุด
                  </div>
                  <div className="space-y-1">
                    {flowAnalysis.topSenders.map((item, index) => (
                      <div
                        key={item.nodeId}
                        onClick={() => onNodeSelect?.(item.nodeId)}
                        className="flex items-center justify-between p-2 bg-dark-900 rounded-lg hover:bg-dark-700 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-dark-500">#{index + 1}</span>
                          <span className="text-xs text-white truncate max-w-[120px]">{item.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-red-400">-{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Known Entities Tab */}
            {activeTab === 'entities' && (
              <div className="p-3 space-y-2">
                <div className="text-xs text-dark-400 mb-2">ผู้ให้บริการที่รู้จัก</div>
                {knownEntities.length === 0 ? (
                  <div className="text-center text-dark-500 text-sm py-4">
                    ไม่พบ Exchange/Service ที่รู้จัก
                  </div>
                ) : (
                  knownEntities.map(({ node, entity }) => (
                    <div
                      key={node.id}
                      onClick={() => onNodeSelect?.(node.id)}
                      className="p-3 bg-dark-900 rounded-lg hover:bg-dark-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white">{entity.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          entity.risk === 'high' ? 'bg-red-500/20 text-red-400' :
                          entity.risk === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {entity.risk === 'high' ? '⚠️ ความเสี่ยงสูง' :
                           entity.risk === 'medium' ? '⚡ ความเสี่ยงปานกลาง' :
                           '✓ ปลอดภัย'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-dark-400">
                        <span className="px-2 py-0.5 bg-dark-700 rounded">{entity.type}</span>
                        <span className="truncate">{node.identifier?.slice(0, 16)}...</span>
                      </div>
                    </div>
                  ))
                )}
                
                {/* High Risk Warning */}
                {knownEntities.some(e => e.entity.risk === 'high') && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 text-xs">
                      <AlertTriangle size={14} />
                      <span className="font-semibold">พบ Mixer/Service ความเสี่ยงสูง!</span>
                    </div>
                    <p className="text-xs text-red-300 mt-1">
                      อาจเกี่ยวข้องกับการฟอกเงินหรือกิจกรรมผิดกฎหมาย
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
