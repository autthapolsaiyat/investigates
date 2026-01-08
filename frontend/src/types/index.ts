export type UserRole = 'super_admin' | 'org_admin' | 'investigator' | 'viewer';
export type LicensePlan = 'trial' | 'standard' | 'enterprise';
export type CaseStatus = 'open' | 'investigating' | 'legal' | 'court' | 'closed';
export type CasePriority = 'low' | 'medium' | 'high' | 'critical';
export type CaseType = 'gambling' | 'drug' | 'fraud' | 'money_laundering' | 'cyber' | 'other';

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  organization_id?: number;
  is_active: boolean;
  last_login?: string;
}

export interface Case {
  id: number;
  case_number: string;
  title: string;
  description?: string;
  case_type: CaseType;
  status: CaseStatus;
  priority: CasePriority;
  created_at: string;
  site_count?: number;
  evidence_count?: number;
  suspect_count?: number;
}

export interface GraphNode {
  id: string;
  label: string;
  color?: string;
  size?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  value?: number;
}
