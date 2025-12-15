// src/api/axiosInstance.jsx
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(
  (config) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const token = userInfo?.access;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ اضافه کردن response interceptor برای handle کردن 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token منقضی شده - logout
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
