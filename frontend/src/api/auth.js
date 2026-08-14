import api from './client';

export async function login(username, password) {
  const { data } = await api.post('/auth/login/', { username, password });
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  return data.user;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me/');
  return data;
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}