// src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api', // بدون اسلش آخر
});

axiosInstance.interceptors.request.use((config) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const token = userInfo?.access; // ⚠️ توجه: از access استفاده کن نه token
  
  console.log('🔑 Axios Interceptor - Access Token:', token ? 'Exists' : 'Missing');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // ⚠️ از access استفاده کن
    console.log('✅ Authorization header added with access token');
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosInstance;