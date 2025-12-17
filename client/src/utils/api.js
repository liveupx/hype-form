import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const authData = localStorage.getItem('hypeform-auth');
    if (authData) {
      try {
        const { state } = JSON.parse(authData);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;

    // Handle different error statuses
    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - clear auth and redirect
          localStorage.removeItem('hypeform-auth');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;

        case 403:
          toast.error('You do not have permission to perform this action');
          break;

        case 404:
          // Don't show toast for 404, let the component handle it
          break;

        case 422:
          // Validation errors
          const errors = response.data?.errors;
          if (errors && Array.isArray(errors)) {
            errors.forEach((err) => toast.error(err.msg || err.message));
          } else {
            toast.error(response.data?.message || 'Validation error');
          }
          break;

        case 429:
          toast.error('Too many requests. Please try again later.');
          break;

        case 500:
          toast.error('Server error. Please try again later.');
          break;

        default:
          // Show error message from response
          if (response.data?.error) {
            toast.error(response.data.error);
          } else if (response.data?.message) {
            toast.error(response.data.message);
          }
      }
    } else if (error.request) {
      // Request made but no response received
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper functions for common operations
export const fetcher = (url) => api.get(url).then((res) => res.data);

export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

export const uploadMultipleFiles = async (files, onProgress) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await api.post('/uploads/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
};
