// API utility functions for Pain du Jour Standalone

export const getUser = () => {
  try {
    const user = localStorage.getItem('pain_du_jour_user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const getToken = () => {
  return localStorage.getItem('pain_du_jour_token');
};

export const setAuth = (token, user) => {
  localStorage.setItem('pain_du_jour_token', token);
  localStorage.setItem('pain_du_jour_user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('pain_du_jour_token');
  localStorage.removeItem('pain_du_jour_user');
};

export const API_URL = process.env.REACT_APP_BACKEND_URL || '';
