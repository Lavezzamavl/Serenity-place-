import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Attach the access token to every outgoing request, if we have one.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a request comes back 401 (expired access token), try to silently
// refresh it using the refresh token, then retry the original request once.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          // Use the same base URL as everything else instead of a
          // hardcoded localhost address, so this still works once deployed.
          const { data } = await axios.post(`${API_BASE}/auth/refresh/`, {
            refresh: refreshToken,
          });
          localStorage.setItem('access_token', data.access);

          // SIMPLE_JWT has ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION
          // enabled server-side, so every refresh call both issues a new
          // refresh token AND blacklists the one we just used. If we don't
          // persist the new one here, the *next* refresh attempt will send
          // a token the server has already invalidated, get a 401 back,
          // and force-logout the user - even though they were still active.
          if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh);
          }

          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.reload(); // bounce back to login
        }
      }
    }
    return Promise.reject(error);
  }
);

// DRF's DEFAULT_PAGINATION_CLASS wraps every list endpoint's response as
// { count, next, previous, results: [...] } instead of a plain array.
// Non-list endpoints (single objects, POST responses) are unaffected.
// Use this on every GET that hits a ModelViewSet's list route so callers
// always get a plain array back, regardless of whether pagination kicked in.
export function unwrapList(data) {
  if (Array.isArray(data)) return data;
  return data?.results ?? [];
}

export default api;