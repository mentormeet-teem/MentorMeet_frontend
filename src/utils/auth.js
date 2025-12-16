import axios from 'axios';
export const setAuthToken = (token) => {
  try {
    if (!token) {
      throw new Error('No token provided');
    }
    
    if (typeof token !== 'string') {
      throw new Error('Token must be a string');
    }
    
    if (token.trim() === '') {
      throw new Error('Token cannot be empty');
    }
    
    sessionStorage.setItem('mentormeet_token', token);
    
    setupAxiosHeaders(token);
    
    return true;
  } catch (error) {
    console.error('Failed to set auth token:', error.message);
    
    removeAuthToken();
    throw error; 
  }
};
export const getAuthToken = () => {
  try {
    return sessionStorage.getItem('mentormeet_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};
export const removeAuthToken = () => {
  try {
    sessionStorage.removeItem('mentormeet_token');
    delete axios.defaults.headers.common['Authorization'];
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch (e) {
    return false;
  }
};
export const getUserRole = (token) => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch (e) {
    console.error('Error getting user role:', e);
    return null;
  }
};
export const setupAxiosHeaders = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};
export const initializeAuth = () => {
  const token = getAuthToken();
  setupAxiosHeaders(token);
  return token;
};
axios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

initializeAuth();
