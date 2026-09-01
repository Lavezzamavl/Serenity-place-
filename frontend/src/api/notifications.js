import api from './client';

export async function getNotifications(unreadOnly = false) {
  const { data } = await api.get(`/notifications/${unreadOnly ? '?unread=true' : ''}`);
  return Array.isArray(data) ? data : (data.results || []);
}

export async function markNotificationRead(id) {
  const { data } = await api.post(`/notifications/${id}/mark_read/`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post('/notifications/mark_all_read/');
  return data;
}