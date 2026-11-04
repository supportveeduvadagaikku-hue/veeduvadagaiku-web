import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Normalize base API URL
const getApiBaseUrl = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isVercelHostedApp =
    hostname === 'veeduvadagaikkuchennai.com' ||
    hostname.endsWith('.veeduvadagaikkuchennai.com') ||
    (hostname.endsWith('.vercel.app') && hostname.includes('veeduvadagaiku'));

  // Vercel rewrites /api and /uploads to the Voroa backend. Keep browser
  // requests same-origin there so a stale VITE_API_URL cannot bypass the proxy.
  if (isVercelHostedApp) return '';

  let url = import.meta.env.VITE_API_URL;
  if (!url) {
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      return 'http://localhost:5000';
    }
    // In production, use same-origin relative URLs so Vercel proxies /api requests to the backend.
    return '';
  }
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('vv_token');
    if (!token) {
      token = useAuthStore.getState().token;
      if (token) {
        localStorage.setItem('vv_token', token);
      }
    }
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try { useAuthStore.getState().logout(); } catch {}

      // Don't loop redirect if already on login/register/public routes
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/admin/login')) {
        localStorage.removeItem('vv_token');
        localStorage.removeItem('vv_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
