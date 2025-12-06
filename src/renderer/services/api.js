// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue = [];

// 🔥 Rate limit tracking
let rateLimitedUntil = 0;
const RATE_LIMIT_BACKOFF = 10000; // 10 seconds

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // 🔥 Check if we're still rate limited
    const now = Date.now();
    if (rateLimitedUntil > now) {
      const waitTime = Math.ceil((rateLimitedUntil - now) / 1000);
      console.warn(`⏳ Rate limited. Please wait ${waitTime}s before retrying.`);
      return Promise.reject(new axios.Cancel(`Rate limited. Wait ${waitTime}s.`));
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API Interceptor] Sending Authorization header: Bearer ${token ? '[TOKEN_PRESENT]' : '[TOKEN_MISSING]'}`);
    } else {
      console.log('[API Interceptor] No token found in localStorage. Not sending Authorization header.');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with auto-refresh and rate limit handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 🔥 Handle 429 Rate Limiting
    if (error.response?.status === 429) {
      console.warn('⚠️ Rate limited by server (429)');
      
      // Check for Retry-After header
      const retryAfter = error.response.headers['retry-after'];
      const backoffTime = retryAfter 
        ? parseInt(retryAfter) * 1000 
        : RATE_LIMIT_BACKOFF;
      
      rateLimitedUntil = Date.now() + backoffTime;
      
      // Don't retry automatically - let user try again after backoff
      error.message = `Too many requests. Please wait ${Math.ceil(backoffTime / 1000)} seconds.`;
      return Promise.reject(error);
    }

    const requestUrl = originalRequest?.url || "";
    const isAuthRequest =
      requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");

    // 🔥 Handle 401 Unauthorized with token refresh (skip auth endpoints)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
          refreshToken: refreshToken
        });

        const { token, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        processQueue(null, token);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      console.error('Access forbidden');
    }

    return Promise.reject(error);
  }
);

export default api;