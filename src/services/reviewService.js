// src/services/reviewService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const reviewService = {
  // Get all reviews with filtering and pagination
  getAllReviews: async (params = {}) => {
    try {
      const response = await api.get('/api/Review/admin/all', { 
        params: {
          page: 1,
          pageSize: 10,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },

  // Update review status
  updateReviewStatus: async (reviewId, { status, notes = '' }) => {
    try {
      const response = await api.put(
        `/api/Review/admin/${reviewId}/status`,
        { status, notes }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating review status:', error);
      throw error;
    }
  },

  // Get review statistics
  getReviewStats: async () => {
    try {
      const response = await api.get('/api/Review/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw error;
    }
  }
};

export default reviewService;