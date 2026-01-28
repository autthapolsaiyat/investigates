/**
 * Case Store
 * Zustand store for selected case and data counts
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Case } from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'https://investigates-api.azurewebsites.net/api/v1';

interface DataCounts {
  moneyFlow: number;      // nodes + edges count
  crypto: number;         // crypto wallets/transactions
  calls: number;          // call records
  locations: number;      // location points
  evidences: number;      // total evidences
}

interface CaseState {
  // State
  selectedCaseId: number | null;
  selectedCase: Case | null;
  dataCounts: DataCounts;
  isLoadingCounts: boolean;

  // Actions
  setSelectedCase: (caseId: number | null, caseData: Case | null) => void;
  fetchDataCounts: (caseId: number) => Promise<void>;
  clearCase: () => void;
}

const initialCounts: DataCounts = {
  moneyFlow: 0,
  crypto: 0,
  calls: 0,
  locations: 0,
  evidences: 0,
};

export const useCaseStore = create<CaseState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedCaseId: null,
      selectedCase: null,
      dataCounts: initialCounts,
      isLoadingCounts: false,

      // Set selected case
      setSelectedCase: (caseId: number | null, caseData: Case | null) => {
        set({ 
          selectedCaseId: caseId, 
          selectedCase: caseData,
          dataCounts: initialCounts 
        });
        
        // Fetch counts if case selected
        if (caseId) {
          get().fetchDataCounts(caseId);
        }
      },

      // Fetch data counts for case
      fetchDataCounts: async (caseId: number) => {
        set({ isLoadingCounts: true });
        
        const token = localStorage.getItem('access_token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        try {
          // Fetch money flow nodes count
          const nodesRes = await fetch(
            `${API_BASE}/cases/${caseId}/money-flow/nodes`,
            { headers }
          );
          const nodes = nodesRes.ok ? await nodesRes.json() : [];
          
          // Fetch money flow edges count
          const edgesRes = await fetch(
            `${API_BASE}/cases/${caseId}/money-flow/edges`,
            { headers }
          );
          const edges = edgesRes.ok ? await edgesRes.json() : [];

          // Fetch evidences for this case
          const evidencesRes = await fetch(
            `${API_BASE}/evidences/case/${caseId}`,
            { headers }
          );
          const evidences = evidencesRes.ok ? await evidencesRes.json() : [];

          // Fetch crypto transactions count (from crypto_transactions table)
          const cryptoRes = await fetch(
            `${API_BASE}/crypto/case/${caseId}/transactions?limit=1000`,
            { headers }
          );
          const cryptoTransactions = cryptoRes.ok ? await cryptoRes.json() : [];

          // Count by evidence type (for calls and locations)
          let callsCount = 0;
          let locationsCount = 0;

          evidences.forEach((ev: any) => {
            const fileType = ev.file_type?.toLowerCase() || '';
            const fileName = ev.file_name?.toLowerCase() || '';
            
            if (fileType === 'phone' || fileName.includes('call')) {
              callsCount += ev.records_count || 1;
            } else if (fileType === 'location' || fileName.includes('location') || fileName.includes('gps')) {
              locationsCount += ev.records_count || 1;
            }
          });

          set({
            dataCounts: {
              moneyFlow: nodes.length + edges.length,
              crypto: cryptoTransactions.length,  // Count from crypto_transactions API
              calls: callsCount,
              locations: locationsCount,
              evidences: evidences.length,
            },
            isLoadingCounts: false,
          });
        } catch (err) {
          console.error('Error fetching data counts:', err);
          set({ isLoadingCounts: false });
        }
      },

      // Clear case selection
      clearCase: () => {
        set({
          selectedCaseId: null,
          selectedCase: null,
          dataCounts: initialCounts,
        });
      },
    }),
    {
      name: 'case-storage',
      partialize: (state) => ({ 
        selectedCaseId: state.selectedCaseId,
        // Don't persist full case data or counts
      }),
    }
  )
);
