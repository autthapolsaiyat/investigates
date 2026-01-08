/**
 * API Service
 * Axios client configured for InvestiGate Backend API
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Base URL - change based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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
    const { user, tokens } = response.data;
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
  list: async (params?: CaseListParams): Promise<PaginatedResponse<Case>> => {
    const response = await api.get('/cases', { params });
    return response.data;
  },

  get: async (id: number): Promise<Case> => {
    const response = await api.get(`/cases/${id}`);
    return response.data;
  },

  create: async (data: CaseCreateData): Promise<Case> => {
    const response = await api.post('/cases', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Case>): Promise<Case> => {
    const response = await api.patch(`/cases/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, status: string, notes?: string): Promise<Case> => {
    const response = await api.patch(`/cases/${id}/status`, { status, notes });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/cases/${id}`);
  },

  getStatistics: async (): Promise<CaseStatistics> => {
    const response = await api.get('/cases/statistics');
    return response.data;
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

// Export default api instance
export default api;
