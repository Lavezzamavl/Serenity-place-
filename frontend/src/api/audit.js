import api from './client';

export async function getAuditLogs(params = {}) {
  const { data } = await api.get('/audit/', { params });
  // Handle both a plain array response and DRF's paginated
  // { count, next, previous, results } shape.
  return Array.isArray(data) ? data : data.results ?? [];
}