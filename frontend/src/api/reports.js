import api from './client';

export async function getSummaryReport() {
  const { data } = await api.get('/reports/summary/');
  return data;
}

export async function getDashboardSummary() {
  const { data } = await api.get('/reports/dashboard/');
  return data;
}