/**
 * API Service
 * Axios client configured for InvestiGate Backend API
 */
import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// API Base URL - change based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://investigates-api.azurewebsites.net/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Token helpers
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          // Try to refresh token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token } = response.data;
          setTokens(access_token, refresh_token);

          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - logout
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token - logout
        clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ============== Auth API ==============

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  organization_code?: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  organization_id?: number;
  organization_name?: string;
  position?: string;
  status?: string;
  subscription_start?: string;
  subscription_end?: string;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse {
  user: User;
  tokens: TokenResponse;
}

export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    const { tokens } = response.data;
    setTokens(tokens.access_token, tokens.refresh_token);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  me: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async (): Promise<TokenResponse> => {
    const refreshToken = getRefreshToken();
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    const tokens = response.data;
    setTokens(tokens.access_token, tokens.refresh_token);
    return tokens;
  },
};

// ============== Users API ==============

export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  role?: string;
  organization_id?: number;
  is_active?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const usersAPI = {
  list: async (params?: UserListParams): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  get: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: Partial<User> & { password: string }): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  changePassword: async (id: number, currentPassword: string, newPassword: string): Promise<void> => {
    await api.post(`/users/${id}/change-password`, {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  // Admin: Reset user password with random temporary password
  resetPassword: async (id: number): Promise<{ message: string; user_id: number; temporary_password: string }> => {
    const response = await api.post(`/users/${id}/reset-password`);
    return response.data;
  },

  // Admin: Renew/extend subscription
  renewSubscription: async (id: number, days: number): Promise<{
    message: string;
    user_id: number;
    subscription_start: string;
    subscription_end: string;
    days_added: number;
  }> => {
    const response = await api.post(`/users/${id}/renew-subscription`, { days });
    return response.data;
  },

  // Admin: Cancel subscription
  cancelSubscription: async (id: number): Promise<{ message: string; user_id: number }> => {
    const response = await api.post(`/users/${id}/cancel-subscription`);
    return response.data;
  },
};

// ============== Organizations API ==============

export interface Organization {
  id: number;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  max_users: number;
  license_expires_at?: string;
  created_at: string;
  updated_at: string;
  users_count?: number;
  cases_count?: number;
}

export const organizationsAPI = {
  list: async (params?: { page?: number; page_size?: number; search?: string }): Promise<PaginatedResponse<Organization>> => {
    const response = await api.get('/organizations', { params });
    return response.data;
  },

  get: async (id: number): Promise<Organization> => {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
  },

  create: async (data: Partial<Organization>): Promise<Organization> => {
    const response = await api.post('/organizations', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Organization>): Promise<Organization> => {
    const response = await api.patch(`/organizations/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/organizations/${id}`);
  },

  getStats: async (id: number): Promise<any> => {
    const response = await api.get(`/organizations/${id}/stats`);
    return response.data;
  },
};

// ============== Cases API ==============

export interface Case {
  id: number;
  case_number: string;
  title: string;
  description?: string;
  case_type: string;
  status: string;
  priority: string;
  total_amount: number;
  currency: string;
  victims_count: number;
  suspects_count: number;
  organization_id: number;
  created_by: number;
  assigned_to?: number;
  created_by_user?: User;
  assigned_to_user?: User;
  incident_date?: string;
  reported_date?: string;
  closed_date?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
  nodes_count?: number;
  edges_count?: number;
  // Soft Delete fields
  is_active?: boolean;
  deleted_at?: string;
  deleted_by?: number;
}

export interface DeletedCase {
  id: number;
  case_number: string;
  title: string;
  case_type: string;
  status: string;
  priority: string;
  total_amount: number;
  organization_id: number;
  created_at: string;
  deleted_at?: string;
  deleted_by?: number;
  deleted_by_email?: string;
}

export interface CaseDeleteResponse {
  message: string;
  case_id: number;
  case_number: string;
  deleted_by: string;
  deleted_at: string;
}

export interface CaseCreateData {
  title: string;
  description?: string;
  case_type?: string;
  priority?: string;
  total_amount?: number;
  currency?: string;
  victims_count?: number;
  suspects_count?: number;
  incident_date?: string;
  reported_date?: string;
  tags?: string;
  assigned_to?: number;
}

export interface CaseListParams {
  page?: number;
  page_size?: number;
  search?: string;
  case_type?: string;
  status?: string;
  priority?: string;
  assigned_to?: number;
}

export interface CaseStatistics {
  total_cases: number;
  open_cases: number;
  closed_cases: number;
  total_amount: number;
  total_victims: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
}

export const casesAPI = {
  // List active cases
  list: async (params?: CaseListParams): Promise<PaginatedResponse<Case>> => {
    const response = await api.get('/cases', { params });
    return response.data;
  },

  // Get single case
  get: async (id: number): Promise<Case> => {
    const response = await api.get(`/cases/${id}`);
    return response.data;
  },

  // Create case
  create: async (data: CaseCreateData): Promise<Case> => {
    const response = await api.post('/cases', data);
    return response.data;
  },

  // Update case
  update: async (id: number, data: Partial<Case>): Promise<Case> => {
    const response = await api.patch(`/cases/${id}`, data);
    return response.data;
  },

  // Update status
  updateStatus: async (id: number, status: string, notes?: string): Promise<Case> => {
    const response = await api.patch(`/cases/${id}/status`, { status, notes });
    return response.data;
  },

  // ★ SOFT DELETE: Delete case (sets is_active=false)
  delete: async (id: number): Promise<CaseDeleteResponse> => {
    const response = await api.delete(`/cases/${id}`);
    return response.data;
  },

  // Get statistics
  getStatistics: async (): Promise<CaseStatistics> => {
    const response = await api.get('/cases/statistics');
    return response.data;
  },

  // ★ ADMIN: List deleted cases
  listDeleted: async (params?: { page?: number; page_size?: number; search?: string }): Promise<DeletedCase[]> => {
    const response = await api.get('/cases/admin/deleted', { params });
    return response.data;
  },

  // ★ ADMIN: Count deleted cases
  countDeleted: async (): Promise<{ deleted_count: number }> => {
    const response = await api.get('/cases/admin/deleted/count');
    return response.data;
  },

  // ★ ADMIN: Restore deleted case
  restore: async (id: number): Promise<Case> => {
    const response = await api.post(`/cases/${id}/restore`);
    return response.data;
  },

  // ★ SUPER ADMIN: Permanent delete
  permanentDelete: async (id: number): Promise<void> => {
    await api.delete(`/cases/${id}/permanent`);
  },
};

// ============== Money Flow API ==============

export interface MoneyFlowNode {
  id: number;
  case_id: number;
  node_type: string;
  label: string;
  identifier?: string;
  bank_name?: string;
  account_name?: string;
  phone_number?: string;
  id_card?: string;
  blockchain?: string;
  wallet_address?: string;
  risk_score: number;
  is_suspect: boolean;
  is_victim: boolean;
  x_position?: number;
  y_position?: number;
  color?: string;
  size: number;
  notes?: string;
  source?: string;
  metadata?: string;
  created_at: string;
  updated_at: string;
}

export interface MoneyFlowEdge {
  id: number;
  case_id: number;
  from_node_id: number;
  to_node_id: number;
  amount?: number;
  currency: string;
  transaction_date?: string;
  transaction_ref?: string;
  label?: string;
  edge_type: string;
  color?: string;
  width: number;
  dashes: boolean;
  evidence_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MoneyFlowGraph {
  case_id: number;
  nodes: MoneyFlowNode[];
  edges: MoneyFlowEdge[];
  total_amount: number;
  node_count: number;
  edge_count: number;
  suspects_count: number;
  victims_count: number;
}

export const moneyFlowAPI = {
  // Get complete graph
  getGraph: async (caseId: number): Promise<MoneyFlowGraph> => {
    const response = await api.get(`/cases/${caseId}/money-flow`);
    return response.data;
  },

  // Nodes
  listNodes: async (caseId: number): Promise<MoneyFlowNode[]> => {
    const response = await api.get(`/cases/${caseId}/money-flow/nodes`);
    return response.data;
  },

  createNode: async (caseId: number, data: Partial<MoneyFlowNode>): Promise<MoneyFlowNode> => {
    const response = await api.post(`/cases/${caseId}/money-flow/nodes`, data);
    return response.data;
  },

  createNodesBulk: async (caseId: number, nodes: Partial<MoneyFlowNode>[]): Promise<MoneyFlowNode[]> => {
    const response = await api.post(`/cases/${caseId}/money-flow/nodes/bulk`, { nodes });
    return response.data;
  },

  updateNode: async (caseId: number, nodeId: number, data: Partial<MoneyFlowNode>): Promise<MoneyFlowNode> => {
    const response = await api.patch(`/cases/${caseId}/money-flow/nodes/${nodeId}`, data);
    return response.data;
  },

  deleteNode: async (caseId: number, nodeId: number): Promise<void> => {
    await api.delete(`/cases/${caseId}/money-flow/nodes/${nodeId}`);
  },

  updateNodePositions: async (caseId: number, positions: { id: number; x: number; y: number }[]): Promise<MoneyFlowNode[]> => {
    const response = await api.patch(`/cases/${caseId}/money-flow/nodes/positions`, { positions });
    return response.data;
  },

  // Edges
  listEdges: async (caseId: number): Promise<MoneyFlowEdge[]> => {
    const response = await api.get(`/cases/${caseId}/money-flow/edges`);
    return response.data;
  },

  createEdge: async (caseId: number, data: Partial<MoneyFlowEdge>): Promise<MoneyFlowEdge> => {
    const response = await api.post(`/cases/${caseId}/money-flow/edges`, data);
    return response.data;
  },

  createEdgesBulk: async (caseId: number, edges: Partial<MoneyFlowEdge>[]): Promise<MoneyFlowEdge[]> => {
    const response = await api.post(`/cases/${caseId}/money-flow/edges/bulk`, { edges });
    return response.data;
  },

  updateEdge: async (caseId: number, edgeId: number, data: Partial<MoneyFlowEdge>): Promise<MoneyFlowEdge> => {
    const response = await api.patch(`/cases/${caseId}/money-flow/edges/${edgeId}`, data);
    return response.data;
  },

  deleteEdge: async (caseId: number, edgeId: number): Promise<void> => {
    await api.delete(`/cases/${caseId}/money-flow/edges/${edgeId}`);
  },
};

// ==================== EVIDENCE API ====================
export interface Evidence {
  id: number;
  case_id: number;
  file_name: string;
  file_type?: string;
  file_size?: number;
  sha256_hash: string;
  evidence_type: string;
  evidence_source: string;
  records_count?: number;
  columns_info?: string;
  description?: string;
  notes?: string;
  collected_by: number;
  collected_at: string;
  created_at: string;
  updated_at: string;
  collector_name?: string;
  case_number?: string;
  case_title?: string;
}

export interface EvidenceCreate {
  case_id: number;
  file_name: string;
  file_type?: string;
  file_size?: number;
  sha256_hash: string;
  evidence_type?: string;
  evidence_source?: string;
  records_count?: number;
  columns_info?: string;
  description?: string;
  notes?: string;
}

export interface EvidenceVerifyResponse {
  verified: boolean;
  file_name: string;
  sha256_hash: string;
  case_number: string;
  case_title: string;
  collected_at: string;
  collector_name: string;
  message: string;
}

export interface CaseEvidencesResponse {
  case_number: string;
  case_title: string;
  evidences_count: number;
  evidences: Evidence[];
}

export const evidenceAPI = {
  // Create evidence (with auth)
  create: async (data: EvidenceCreate): Promise<Evidence> => {
    const response = await api.post('/evidences/', data);
    return response.data;
  },

  // List evidences for a case (with auth)
  listByCase: async (caseId: number): Promise<Evidence[]> => {
    const response = await api.get(`/evidences/case/${caseId}`);
    return response.data;
  },

  // Get evidence by hash (with auth)
  getByHash: async (hash: string): Promise<Evidence> => {
    const response = await api.get(`/evidences/hash/${hash}`);
    return response.data;
  },

  // Delete evidence (with auth)
  delete: async (evidenceId: number): Promise<void> => {
    await api.delete(`/evidences/${evidenceId}`);
  },

  // Public: Verify evidence by hash (no auth)
  verifyPublic: async (hash: string): Promise<EvidenceVerifyResponse> => {
    const response = await axios.get(`${API_BASE_URL}/evidences/public/verify/${hash}`);
    return response.data;
  },

  // Public: Get case evidences by case number (no auth)
  getCaseEvidencesPublic: async (caseNumber: string): Promise<CaseEvidencesResponse> => {
    const response = await axios.get(`${API_BASE_URL}/evidences/public/case/${caseNumber}`);
    return response.data;
  },
};

// ============== Registration API ==============

export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface RegistrationRequest {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  organization_name?: string;
  position?: string;
  status: RegistrationStatus;
  created_at: string;
  updated_at: string;
  processed_by?: number;
  processed_at?: string;
  rejection_reason?: string;
  subscription_days?: number;
}

export interface RegistrationCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  organization_name?: string;
  position?: string;
}

export interface RegistrationApprove {
  subscription_days: number;
  role?: string;
  notes?: string;
}

export interface RegistrationReject {
  reason: string;
}

export interface RegistrationStatusCheck {
  email: string;
  status: RegistrationStatus;
  created_at: string;
  rejection_reason?: string;
}

export interface RegistrationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  today: number;
  this_week: number;
  this_month: number;
}

export interface RegistrationListParams {
  status?: RegistrationStatus;
  page?: number;
  page_size?: number;
  search?: string;
}

export const registrationAPI = {
  // Public: Submit registration request
  submit: async (data: RegistrationCreate): Promise<RegistrationRequest> => {
    const response = await axios.post(`${API_BASE_URL}/registrations/`, data);
    return response.data;
  },

  // Public: Check registration status by email
  checkStatus: async (email: string): Promise<RegistrationStatusCheck> => {
    const response = await axios.get(`${API_BASE_URL}/registrations/status/${encodeURIComponent(email)}`);
    return response.data;
  },

  // Admin: List all registrations
  list: async (params?: RegistrationListParams): Promise<PaginatedResponse<RegistrationRequest>> => {
    const response = await api.get('/registrations', { params });
    return response.data;
  },

  // Admin: Get registration stats
  getStats: async (): Promise<RegistrationStats> => {
    const response = await api.get('/registrations/stats');
    return response.data;
  },

  // Admin: Get single registration
  get: async (id: number): Promise<RegistrationRequest> => {
    const response = await api.get(`/registrations/${id}`);
    return response.data;
  },

  // Admin: Approve registration
  approve: async (id: number, data: RegistrationApprove): Promise<RegistrationRequest> => {
    const response = await api.post(`/registrations/${id}/approve`, data);
    return response.data;
  },

  // Admin: Reject registration
  reject: async (id: number, data: RegistrationReject): Promise<RegistrationRequest> => {
    const response = await api.post(`/registrations/${id}/reject`, data);
    return response.data;
  },

  // Admin: Delete registration
  delete: async (id: number): Promise<void> => {
    await api.delete(`/registrations/${id}`);
  },
};

// ============== Support Tickets API ==============

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketCategory = 'bug' | 'feature' | 'question' | 'other';

export interface SupportTicket {
  id: number;
  ticket_number: string;
  user_id: number;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  has_screenshot: boolean;
  screenshot_data?: string;
  screenshot_filename?: string;
  admin_response?: string;
  resolved_by?: number;
  resolved_at?: string;
  user_read_at?: string;
  created_at: string;
  updated_at: string;
  is_unread?: boolean;
  has_admin_response?: boolean;
  // For admin view
  user?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  resolver?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface TicketListItem {
  id: number;
  ticket_number: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  has_screenshot: boolean;
  has_admin_response: boolean;
  is_unread: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface TicketCreateData {
  subject: string;
  description: string;
  category: TicketCategory;
  screenshot_base64?: string;
  screenshot_filename?: string;
}

export interface TicketAdminUpdateData {
  status?: TicketStatus;
  priority?: TicketPriority;
  admin_response?: string;
}

export interface TicketListResponse {
  items: TicketListItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  unread_count: number;
}

export interface AdminTicketListResponse {
  items: SupportTicket[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  today: number;
  this_week: number;
  bugs: number;
  features: number;
  questions: number;
  others: number;
}

export interface TicketListParams {
  page?: number;
  page_size?: number;
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  search?: string;
}

export const supportAPI = {
  // ============== User Endpoints ==============
  
  // Create a new ticket
  create: async (data: TicketCreateData): Promise<SupportTicket> => {
    const response = await api.post('/support/tickets', data);
    return response.data;
  },

  // List my tickets
  list: async (params?: { page?: number; page_size?: number; status?: TicketStatus }): Promise<TicketListResponse> => {
    const response = await api.get('/support/tickets', { params });
    return response.data;
  },

  // Get single ticket
  get: async (id: number): Promise<SupportTicket> => {
    const response = await api.get(`/support/tickets/${id}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const response = await api.get('/support/tickets/unread/count');
    return response.data;
  },

  // Mark ticket as read
  markAsRead: async (id: number): Promise<void> => {
    await api.post(`/support/tickets/${id}/read`);
  },

  // ============== Admin Endpoints ==============

  // Admin: List all tickets
  adminList: async (params?: TicketListParams): Promise<AdminTicketListResponse> => {
    const response = await api.get('/support/admin/tickets', { params });
    return response.data;
  },

  // Admin: Get stats
  adminGetStats: async (): Promise<TicketStats> => {
    const response = await api.get('/support/admin/stats');
    return response.data;
  },

  // Admin: Get single ticket
  adminGet: async (id: number): Promise<SupportTicket> => {
    const response = await api.get(`/support/admin/tickets/${id}`);
    return response.data;
  },

  // Admin: Update ticket
  adminUpdate: async (id: number, data: TicketAdminUpdateData): Promise<SupportTicket> => {
    const response = await api.patch(`/support/admin/tickets/${id}`, data);
    return response.data;
  },
};


// ============== Login History API ==============

export interface LoginHistoryItem {
  id: number;
  user_id: number;
  login_at: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  login_success: boolean;
  failure_reason?: string;
  user_email?: string;
  user_name?: string;
}

export interface LoginHistoryListResponse {
  items: LoginHistoryItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface LoginMapPoint {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  login_at: string;
  ip_address?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  is_online: boolean;
}

export interface LoginMapResponse {
  points: LoginMapPoint[];
  total_logins: number;
  unique_users: number;
  unique_locations: number;
}

export interface LoginStats {
  total_logins_today: number;
  total_logins_week: number;
  total_logins_month: number;
  unique_users_today: number;
  failed_logins_today: number;
  top_locations: Array<{ city: string; country: string; count: number }>;
  top_devices: Array<{ device_type: string; browser: string; count: number }>;
}

export const loginHistoryAPI = {
  // List login history
  list: async (params?: {
    page?: number;
    page_size?: number;
    user_id?: number;
    success_only?: boolean;
    days?: number;
  }): Promise<LoginHistoryListResponse> => {
    const response = await api.get('/login-history', { params });
    return response.data;
  },

  // Get map data
  getMapData: async (days: number = 7): Promise<LoginMapResponse> => {
    const response = await api.get('/login-history/map', { params: { days } });
    return response.data;
  },

  // Get stats
  getStats: async (): Promise<LoginStats> => {
    const response = await api.get('/login-history/stats');
    return response.data;
  },

  // Get user login history
  getUserHistory: async (userId: number, limit: number = 10): Promise<LoginHistoryItem[]> => {
    const response = await api.get(`/login-history/user/${userId}`, { params: { limit } });
    return response.data;
  },
};

// Export default api instance
export default api;
