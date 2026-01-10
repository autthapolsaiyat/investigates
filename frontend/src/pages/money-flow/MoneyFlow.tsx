/**
 * MoneyFlow Page - Professional Forensic Money Flow Analysis
 * Main page component integrating all Money Flow features
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  Filter, 
  Download, 
  Plus,
  ChevronDown,
  Loader2,
  AlertCircle,
  Network
} from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { MoneyFlowGraph } from './MoneyFlowGraph';
import { AddNodeModal } from './AddNodeModal';
import type { MoneyFlowNode, MoneyFlowEdge } from './types';

interface Case {
  id: number;
  case_number: string;
  title: string;
}

const API_BASE = 'https://investigates-api.azurewebsites.net/api/v1';

export const MoneyFlow = () => {
  // State
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [nodes, setNodes] = useState<MoneyFlowNode[]>([]);
  const [edges, setEdges] = useState<MoneyFlowEdge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);

  // Get auth token
  const getToken = () => localStorage.getItem('access_token');

  // Fetch cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch(`${API_BASE}/cases?page=1&page_size=100`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (response.ok) {
          const data = await response.json();
          setCases(data.items || []);
          if (data.items?.length > 0 && !selectedCaseId) {
            setSelectedCaseId(data.items[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching cases:', err);
      }
    };
    fetchCases();
  }, []);

  // Fetch nodes and edges when case changes
  const fetchMoneyFlowData = useCallback(async () => {
    if (!selectedCaseId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const headers = { 'Authorization': `Bearer ${getToken()}` };

      // Fetch nodes
      const nodesRes = await fetch(
        `${API_BASE}/cases/${selectedCaseId}/money-flow/nodes`,
        { headers }
      );
      
      // Fetch edges
      const edgesRes = await fetch(
        `${API_BASE}/cases/${selectedCaseId}/money-flow/edges`,
        { headers }
      );

      if (nodesRes.ok && edgesRes.ok) {
        const nodesData = await nodesRes.json();
        const edgesData = await edgesRes.json();
        setNodes(nodesData || []);
        setEdges(edgesData || []);
      } else {
        setError('ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId]);

  // Fetch data when case changes
  useEffect(() => {
    fetchMoneyFlowData();
  }, [fetchMoneyFlowData]);

  // Handle case change
  const handleCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCaseId(Number(e.target.value));
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchMoneyFlowData();
  };

  // Handle export
  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export feature coming soon!');
  };

  // Selected case info
  const selectedCase = cases.find(c => c.id === selectedCaseId);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-700">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Network className="text-primary-400" />
            Money Flow
          </h1>
          <p className="text-sm text-dark-400">วิเคราะห์เส้นทางการเงิน</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Case Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-400">Select Case:</span>
            <div className="relative">
              <select
                value={selectedCaseId || ''}
                onChange={handleCaseChange}
                className="appearance-none bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 pr-8 text-white text-sm min-w-[250px] focus:outline-none focus:border-primary-500"
              >
                {cases.length === 0 ? (
                  <option value="">ไม่พบคดี</option>
                ) : (
                  cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} - {c.title}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
            </div>
          </div>

          {/* Actions */}
          <Button 
            variant="ghost" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>

          <Button variant="ghost">
            <Filter size={18} />
            Filter
          </Button>

          <Button variant="ghost" onClick={handleExport}>
            <Download size={18} />
            Export
          </Button>

          <Button onClick={() => setShowAddNode(true)}>
            <Plus size={18} />
            Add Node
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-dark-900/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={40} className="text-primary-400 animate-spin" />
              <span className="text-dark-300">กำลังโหลดข้อมูล...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2 text-red-400">
              <AlertCircle size={16} />
              {error}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Network size={64} className="text-dark-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                ยังไม่มีข้อมูล Money Flow
              </h3>
              <p className="text-dark-400 mb-4">
                เริ่มต้นโดยการเพิ่ม Node แรกของคุณ
              </p>
              <Button onClick={() => setShowAddNode(true)}>
                <Plus size={18} className="mr-2" />
                Add First Node
              </Button>
            </div>
          </div>
        )}

        {/* Graph */}
        {nodes.length > 0 && (
          <MoneyFlowGraph
            nodes={nodes}
            edges={edges}
            onRefresh={handleRefresh}
          />
        )}
      </div>

      {/* Add Node Modal */}
      {showAddNode && selectedCaseId && (
        <AddNodeModal
          isOpen={showAddNode}
          onClose={() => setShowAddNode(false)}
          caseId={selectedCaseId}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
};

export { MoneyFlow as MoneyFlowPage };
export default MoneyFlow;
