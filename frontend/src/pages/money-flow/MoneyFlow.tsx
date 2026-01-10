/**
 * MoneyFlow Page V2 - Clean & Simple
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  Download, 
  Plus,
  ChevronDown,
  Loader2,
  AlertCircle,
  Network
} from 'lucide-react';
import { Button } from '../../components/ui';
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
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [nodes, setNodes] = useState<MoneyFlowNode[]>([]);
  const [edges, setEdges] = useState<MoneyFlowEdge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);

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

  // Fetch money flow data
  const fetchMoneyFlowData = useCallback(async () => {
    if (!selectedCaseId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const headers = { 'Authorization': `Bearer ${getToken()}` };

      const [nodesRes, edgesRes] = await Promise.all([
        fetch(`${API_BASE}/cases/${selectedCaseId}/money-flow/nodes`, { headers }),
        fetch(`${API_BASE}/cases/${selectedCaseId}/money-flow/edges`, { headers })
      ]);

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

  useEffect(() => {
    fetchMoneyFlowData();
  }, [fetchMoneyFlowData]);

  const handleCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCaseId(Number(e.target.value));
  };

  return (
    <div className="h-full flex flex-col bg-dark-900">
      {/* Header - Compact */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700 bg-dark-800">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Network size={20} className="text-primary-400" />
            Money Flow
          </h1>

          {/* Case Selector */}
          <div className="relative">
            <select
              value={selectedCaseId || ''}
              onChange={handleCaseChange}
              className="appearance-none bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 pr-8 text-white text-sm min-w-[200px] focus:outline-none focus:border-primary-500"
            >
              {cases.length === 0 ? (
                <option value="">ไม่พบคดี</option>
              ) : (
                cases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.case_number}
                  </option>
                ))
              )}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={fetchMoneyFlowData}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </Button>

          <Button variant="ghost" size="sm">
            <Download size={16} />
          </Button>

          <Button size="sm" onClick={() => setShowAddNode(true)}>
            <Plus size={16} />
            เพิ่ม Node
          </Button>
        </div>
      </div>

      {/* Main Content - Full Screen Graph */}
      <div className="flex-1 relative">
        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 bg-dark-900/80 flex items-center justify-center z-10">
            <Loader2 size={40} className="text-primary-400 animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-sm">
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
                ยังไม่มีข้อมูล
              </h3>
              <p className="text-dark-400 mb-4">
                Import จาก Crypto Tracker หรือเพิ่ม Node ใหม่
              </p>
              <Button onClick={() => setShowAddNode(true)}>
                <Plus size={16} className="mr-2" />
                เพิ่ม Node แรก
              </Button>
            </div>
          </div>
        )}

        {/* Graph */}
        {nodes.length > 0 && (
          <MoneyFlowGraph
            nodes={nodes}
            edges={edges}
          />
        )}
      </div>

      {/* Add Node Modal */}
      {showAddNode && selectedCaseId && (
        <AddNodeModal
          isOpen={showAddNode}
          onClose={() => setShowAddNode(false)}
          caseId={selectedCaseId}
          onSuccess={fetchMoneyFlowData}
        />
      )}
    </div>
  );
};

export { MoneyFlow as MoneyFlowPage };
export default MoneyFlow;
