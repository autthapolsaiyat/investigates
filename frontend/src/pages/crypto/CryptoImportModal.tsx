/**
 * CryptoImportModal - Import Crypto Wallet to Money Flow
 * Link Wallet to Case in Money Flow
 */
import { useState, useEffect } from 'react';
import {
  X, Link2, ArrowRight, Database, CheckCircle2, Loader2,
  Wallet, GitMerge, AlertCircle, Plus, ExternalLink
} from 'lucide-react';
import { Button, Badge } from '../../components/ui';

interface WalletData {
  address: string;
  blockchain: string;
  balance: number;
  balanceUSD: number;
  txCount: number;
  riskScore: number;
  labels: string[];
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  valueUSD: number;
  timestamp: string;
  type: 'in' | 'out';
}

interface CryptoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletData: WalletData | null;
  transactions: Transaction[];
}

interface CaseOption {
  id: number;
  case_number: string;
  title: string;
}

export const CryptoImportModal = ({
  isOpen,
  onClose,
  walletData,
  transactions
}: CryptoImportModalProps) => {
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [importOptions, setImportOptions] = useState({
    importMainWallet: true,
    importCounterparties: true,
    importTransactions: true,
    maxTransactions: 50,
    minValueUSD: 100
  });

  // Fetch cases on open
  useEffect(() => {
    if (isOpen) {
      fetchCases();
    }
  }, [isOpen]);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://investigates-api.azurewebsites.net/api/v1/cases?page=1&page_size=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCases(data.items || []);
        if (data.items?.length > 0) {
          setSelectedCaseId(data.items[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const importToMoneyFlow = async () => {
    if (!selectedCaseId || !walletData) return;
    
    setIsImporting(true);
    setResult(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      let nodesCreated = 0;
      let edgesCreated = 0;
      const nodeIdMap = new Map<string, number>();

      // 1. Create main wallet node
      if (importOptions.importMainWallet) {
        const nodeResponse = await fetch(
          `https://investigates-api.azurewebsites.net/api/v1/cases/${selectedCaseId}/money-flow/nodes`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              label: `${walletData.blockchain.toUpperCase()}: ${walletData.address.slice(0, 10)}...`,
              node_type: 'crypto_wallet',
              identifier: walletData.address,
              bank_name: walletData.blockchain.toUpperCase(),
              account_name: walletData.address,
              is_suspect: walletData.riskScore >= 70,
              is_victim: false,
              risk_score: walletData.riskScore,
              notes: `Balance: $${walletData.balanceUSD.toLocaleString()} | TX: ${walletData.txCount} | Labels: ${walletData.labels.join(', ')}`
            })
          }
        );
        
        if (nodeResponse.ok) {
          const node = await nodeResponse.json();
          nodeIdMap.set(walletData.address.toLowerCase(), node.id);
          nodesCreated++;
        }
      }

      // 2. Process transactions
      if (importOptions.importTransactions) {
        const filteredTx = transactions
          .filter(tx => tx.valueUSD >= importOptions.minValueUSD)
          .slice(0, importOptions.maxTransactions);

        // Create counterparty nodes
        if (importOptions.importCounterparties) {
          const counterparties = new Set<string>();
          filteredTx.forEach(tx => {
            const counterparty = tx.type === 'in' ? tx.from : tx.to;
            if (counterparty && counterparty.toLowerCase() !== walletData.address.toLowerCase()) {
              counterparties.add(counterparty.toLowerCase());
            }
          });

          for (const cp of counterparties) {
            if (!nodeIdMap.has(cp)) {
              try {
                const cpResponse = await fetch(
                  `https://investigates-api.azurewebsites.net/api/v1/cases/${selectedCaseId}/money-flow/nodes`,
                  {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                      label: `${walletData.blockchain.toUpperCase()}: ${cp.slice(0, 10)}...`,
                      node_type: 'crypto_wallet',
                      identifier: cp,
                      bank_name: walletData.blockchain.toUpperCase(),
                      account_name: cp,
                      is_suspect: false,
                      is_victim: false,
                      risk_score: 0
                    })
                  }
                );
                
                if (cpResponse.ok) {
                  const cpNode = await cpResponse.json();
                  nodeIdMap.set(cp, cpNode.id);
                  nodesCreated++;
                }
              } catch (err) {
                console.error('Error creating counterparty node:', err);
              }
            }
          }
        }

        // Create edges (transactions)
        for (const tx of filteredTx) {
          const fromAddr = tx.from?.toLowerCase();
          const toAddr = tx.to?.toLowerCase();
          const fromNodeId = nodeIdMap.get(fromAddr);
          const toNodeId = nodeIdMap.get(toAddr);

          if (fromNodeId && toNodeId) {
            try {
              const edgeResponse = await fetch(
                `https://investigates-api.azurewebsites.net/api/v1/cases/${selectedCaseId}/money-flow/edges`,
                {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({
                    from_node_id: fromNodeId,
                    to_node_id: toNodeId,
                    edge_type: 'crypto_transfer',
                    amount: tx.valueUSD,
                    label: `$${tx.valueUSD.toLocaleString()}`,
                    transaction_date: tx.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0],
                    transaction_ref: tx.hash
                  })
                }
              );
              
              if (edgeResponse.ok) {
                edgesCreated++;
              }
            } catch (err) {
              console.error('Error creating edge:', err);
            }
          }
        }
      }

      setResult({
        success: true,
        message: `Import successful! Created ${nodesCreated} nodes and ${edgesCreated} edges`
      });

    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: 'Error importing data'
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-dark-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-dark-600">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GitMerge className="text-primary-400" />
            Import to Money Flow
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-dark-700 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Wallet Summary */}
          {walletData && (
            <div className="p-4 bg-dark-900 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="text-primary-400" />
                <code className="font-mono text-sm">{walletData.address}</code>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-dark-400">{walletData.blockchain.toUpperCase()}</span>
                <span className="text-green-400">${walletData.balanceUSD.toLocaleString()}</span>
                <span className="text-dark-400">{walletData.txCount} TX</span>
                <Badge variant={walletData.riskScore >= 70 ? 'danger' : walletData.riskScore >= 40 ? 'warning' : 'success'}>
                  Risk: {walletData.riskScore}
                </Badge>
              </div>
            </div>
          )}

          {/* Case Selection */}
          <div>
            <label className="text-sm text-dark-400 mb-2 block">Select Case to Import:</label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-dark-400">
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </div>
            ) : (
              <select
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                value={selectedCaseId || ''}
                onChange={(e) => setSelectedCaseId(Number(e.target.value))}
              >
                {cases.length === 0 ? (
                  <option value="">Not foundCase</option>
                ) : (
                  cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} - {c.title}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Import Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-dark-300">Import Options:</p>
            
            <label className="flex items-center gap-3 p-3 bg-dark-900 rounded-lg cursor-pointer hover:bg-dark-850">
              <input
                type="checkbox"
                checked={importOptions.importMainWallet}
                onChange={(e) => setImportOptions(prev => ({ ...prev, importMainWallet: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <Wallet size={16} className="text-primary-400" />
              <span className="text-sm">Import Main Wallet</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-dark-900 rounded-lg cursor-pointer hover:bg-dark-850">
              <input
                type="checkbox"
                checked={importOptions.importCounterparties}
                onChange={(e) => setImportOptions(prev => ({ ...prev, importCounterparties: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <Link2 size={16} className="text-green-400" />
              <span className="text-sm">Import Counterparties (Related Wallets)</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-dark-900 rounded-lg cursor-pointer hover:bg-dark-850">
              <input
                type="checkbox"
                checked={importOptions.importTransactions}
                onChange={(e) => setImportOptions(prev => ({ ...prev, importTransactions: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <ArrowRight size={16} className="text-blue-400" />
              <span className="text-sm">Import Transactions (Edges)</span>
            </label>

            {importOptions.importTransactions && (
              <div className="pl-8 space-y-3">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-dark-400">Maximum:</label>
                  <input
                    type="number"
                    value={importOptions.maxTransactions}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, maxTransactions: parseInt(e.target.value) || 50 }))}
                    className="w-20 bg-dark-700 border border-dark-600 rounded px-2 py-1 text-sm"
                    min={1}
                    max={200}
                  />
                  <span className="text-xs text-dark-500">List</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm text-dark-400">Minimum Value:</label>
                  <input
                    type="number"
                    value={importOptions.minValueUSD}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, minValueUSD: parseFloat(e.target.value) || 0 }))}
                    className="w-24 bg-dark-700 border border-dark-600 rounded px-2 py-1 text-sm"
                    min={0}
                  />
                  <span className="text-xs text-dark-500">USD</span>
                </div>
              </div>
            )}
          </div>

          {/* Stats Preview */}
          <div className="p-4 bg-dark-900 rounded-lg">
            <p className="text-sm text-dark-400 mb-2">Will Import approximately:</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Database className="text-primary-400" size={16} />
                <span className="text-sm">
                  {importOptions.importMainWallet ? 1 : 0} + {importOptions.importCounterparties ? Math.min(transactions.filter(t => t.valueUSD >= importOptions.minValueUSD).length, importOptions.maxTransactions) : 0} Nodes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="text-green-400" size={16} />
                <span className="text-sm">
                  {importOptions.importTransactions ? Math.min(transactions.filter(t => t.valueUSD >= importOptions.minValueUSD).length, importOptions.maxTransactions) : 0} Edges
                </span>
              </div>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="text-green-400" size={20} />
                ) : (
                  <AlertCircle className="text-red-400" size={20} />
                )}
                <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                  {result.message}
                </span>
              </div>
              {result.success && (
                <div className="mt-3">
                  <a
                    href="/money-flow"
                    className="inline-flex items-center gap-2 text-sm text-primary-400 hover:underline"
                  >
                    Go to Money Flow
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-dark-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={importToMoneyFlow} 
            disabled={isImporting || !selectedCaseId || cases.length === 0}
          >
            {isImporting ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                LoadingImport...
              </>
            ) : (
              <>
                <Plus size={18} className="mr-2" />
                Import Money Flow
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CryptoImportModal;
