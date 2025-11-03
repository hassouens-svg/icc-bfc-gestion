import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Get user from localStorage
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Create axios instance with auth header
const apiClient = axios.create({
  baseURL: API,
});

// Add auth header to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = async (username, password, city, department = null) => {
  const response = await axios.post(`${API}/auth/login`, {
    username,
    password,
    city,
    department,
  });
  
  // Store token and user
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  
  return response.data;
};

export const registerVisitor = async (data) => {
  const response = await axios.post(`${API}/auth/register`, data);
  return response.data;
};

// Init data
export const initData = async () => {
  const response = await axios.post(`${API}/init`);
  return response.data;
};

// User APIs
export const createReferent = async (data) => {
  const response = await apiClient.post('/users/referent', data);
  return response.data;
};

export const getReferents = async () => {
  const response = await apiClient.get('/users/referents');
  return response.data;
};

// Visitor APIs
export const createVisitor = async (data) => {
  const response = await apiClient.post('/visitors', data);
  return response.data;
};

export const getVisitors = async () => {
  const response = await apiClient.get('/visitors');
  return response.data;
};

export const getStoppedVisitors = async () => {
  const response = await apiClient.get('/visitors/stopped');
  return response.data;
};

export const getVisitor = async (id) => {
  const response = await apiClient.get(`/visitors/${id}`);
  return response.data;
};

export const updateVisitor = async (id, data) => {
  const response = await apiClient.put(`/visitors/${id}`, data);
  return response.data;
};

export const addComment = async (id, text) => {
  const response = await apiClient.post(`/visitors/${id}/comment`, { text });
  return response.data;
};

export const addPresence = async (id, date, present, type) => {
  const response = await apiClient.post(`/visitors/${id}/presence`, {
    date,
    present,
    type,
  });
  return response.data;
};

export const updateFormation = async (id, formationType, completed) => {
  const response = await apiClient.post(`/visitors/${id}/formation`, {
    formation_type: formationType,
    completed,
  });
  return response.data;
};

export const stopTracking = async (id, reason) => {
  const response = await apiClient.post(`/visitors/${id}/stop-tracking`, {
    reason,
  });
  return response.data;
};

// City APIs
export const createCity = async (name) => {
  const response = await apiClient.post('/cities', { name });
  return response.data;
};

export const getCities = async () => {
  const response = await axios.get(`${API}/cities`);
  return response.data;
};

// Analytics APIs
export const getStats = async () => {
  const response = await apiClient.get('/analytics/stats');
  return response.data;
};

export const exportExcel = async () => {
  const response = await apiClient.get('/analytics/export', {
    responseType: 'blob',
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `visiteurs_${new Date().toISOString().split('T')[0]}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
};

// Fidelisation APIs
export const getReferentFidelisation = async () => {
  const response = await apiClient.get('/fidelisation/referent');
  return response.data;
};

export const getAdminFidelisation = async (week = null, month = null) => {
  const params = {};
  if (week) params.week = week;
  if (month) params.month = month;
  
  const response = await apiClient.get('/fidelisation/admin', { params });
  return response.data;
};
