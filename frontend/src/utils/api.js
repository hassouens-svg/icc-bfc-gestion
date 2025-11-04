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

export const updateUser = async (userId, data) => {
  const response = await apiClient.put(`/users/${userId}`, data);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await apiClient.delete(`/users/${userId}`);
  return response.data;
};

export const blockUser = async (userId) => {
  const response = await apiClient.put(`/users/${userId}/block`);
  return response.data;
};

export const unblockUser = async (userId) => {
  const response = await apiClient.put(`/users/${userId}/unblock`);
  return response.data;
};

export const resetUserPassword = async (userId, newPassword) => {
  const response = await apiClient.put(`/users/${userId}/reset-password`, { new_password: newPassword });
  return response.data;
};

// User Management APIs
export const getUsers = async () => {
  const response = await apiClient.get('/users/referents');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await apiClient.post('/users/referents', userData);
  return response.data;
};

// Visitor APIs
export const createVisitor = async (data) => {
  const response = await apiClient.post('/visitors', data);
  return response.data;
};

export const getVisitors = async (includeStopped = false) => {
  const params = includeStopped ? { include_stopped: true } : {};
  const response = await apiClient.get('/visitors', { params });
  return response.data;
};

export const deleteVisitor = async (id) => {
  const response = await apiClient.delete(`/visitors/${id}`);
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

export const updateCity = async (cityId, name) => {
  const response = await apiClient.put(`/cities/${cityId}`, { name });
  return response.data;
};

export const deleteCity = async (cityId) => {
  const response = await apiClient.delete(`/cities/${cityId}`);
  return response.data;
};

export const getCityStats = async (cityId) => {
  const response = await apiClient.get(`/cities/${cityId}/stats`);
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
  link.setAttribute('download', `nouveaux arrivants et nouveaux convertiss_${new Date().toISOString().split('T')[0]}.xlsx`);
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

// ==================== FAMILLES D'IMPACT APIs ====================

// Secteurs
export const createSecteur = async (data) => {
  const response = await apiClient.post('/fi/secteurs', data);
  return response.data;
};

export const getSecteurs = async (ville = null) => {
  const params = {};
  if (ville) params.ville = ville;
  const response = await apiClient.get('/fi/secteurs', { params });
  return response.data;
};

export const updateSecteur = async (secteurId, data) => {
  const response = await apiClient.put(`/fi/secteurs/${secteurId}`, data);
  return response.data;
};

export const deleteSecteur = async (secteurId) => {
  const response = await apiClient.delete(`/fi/secteurs/${secteurId}`);
  return response.data;
};

// Familles d'Impact
export const createFamilleImpact = async (data) => {
  const response = await apiClient.post('/fi/familles-impact', data);
  return response.data;
};

export const getFamillesImpact = async (secteurId = null, ville = null) => {
  const params = {};
  if (secteurId) params.secteur_id = secteurId;
  if (ville) params.ville = ville;
  const response = await apiClient.get('/fi/familles-impact', { params });
  return response.data;
};

export const getFamilleImpact = async (fiId) => {
  const response = await apiClient.get(`/fi/familles-impact/${fiId}`);
  return response.data;
};

export const updateFamilleImpact = async (fiId, data) => {
  const response = await apiClient.put(`/fi/familles-impact/${fiId}`, data);
  return response.data;
};

export const deleteFamilleImpact = async (fiId) => {
  const response = await apiClient.delete(`/fi/familles-impact/${fiId}`);
  return response.data;
};

// Membres FI
export const createMembreFI = async (data) => {
  const response = await apiClient.post('/fi/membres', data);
  return response.data;
};

export const getMembresFI = async (fiId = null) => {
  const params = {};
  if (fiId) params.fi_id = fiId;
  const response = await apiClient.get('/fi/membres', { params });
  return response.data;
};

export const deleteMembreFI = async (membreId) => {
  const response = await apiClient.delete(`/fi/membres/${membreId}`);
  return response.data;
};

// Présences FI
export const createPresenceFI = async (data) => {
  const response = await apiClient.post('/fi/presences', data);
  return response.data;
};

export const getPresencesFI = async (fiId = null, date = null, membreFiId = null) => {
  const params = {};
  if (fiId) params.fi_id = fiId;
  if (date) params.date = date;
  if (membreFiId) params.membre_fi_id = membreFiId;
  const response = await apiClient.get('/fi/presences', { params });
  return response.data;
};

// Affectation
export const affecterVisiteurToFI = async (data) => {
  const response = await apiClient.post('/fi/affecter-visiteur', data);
  return response.data;
};

export const getIndicateursAffectation = async (ville = null) => {
  const params = {};
  if (ville) params.ville = ville;
  const response = await apiClient.get('/fi/indicateurs/affectation', { params });
  return response.data;
};

// Stats FI
export const getStatsPiloteFI = async () => {
  const response = await apiClient.get('/fi/stats/pilote');
  return response.data;
};

export const getStatsSecteur = async () => {
  const response = await apiClient.get('/fi/stats/secteur');
  return response.data;
};

export const getStatsSuperviseurFI = async (ville = null) => {
  const params = {};
  if (ville) params.ville = ville;
  const response = await apiClient.get('/fi/stats/superviseur', { params });
  return response.data;
};

export const getStatsPasteur = async () => {
  const response = await apiClient.get('/fi/stats/pasteur');
  return response.data;
};
