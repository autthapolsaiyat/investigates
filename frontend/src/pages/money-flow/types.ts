/**
 * TypeScript types for Money Flow
 */

export interface MoneyFlowNode {
  id: number;
  case_id: number;
  label: string;
  node_type: 'bank_account' | 'crypto_wallet' | 'person' | 'company' | 'exchange' | 'unknown';
  identifier?: string;
  bank_name?: string;
  account_name?: string;
  is_suspect: boolean;
  is_victim: boolean;
  risk_score?: number;
  notes?: string;
  position_x?: number;
  position_y?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MoneyFlowEdge {
  id: number;
  case_id: number;
  from_node_id: number;
  to_node_id: number;
  edge_type: 'bank_transfer' | 'crypto_transfer' | 'cash' | 'other';
  amount?: number;
  currency?: string;
  label?: string;
  transaction_date?: string;
  transaction_ref?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MoneyFlowSummary {
  nodeCount: number;
  edgeCount: number;
  totalFlow: number;
  suspectCount: number;
  victimCount: number;
  highRiskCount: number;
}
