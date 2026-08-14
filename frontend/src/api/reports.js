import api from './client';

export async function getSummaryReport() {
  const { data } = await api.get('/reports/summary/');
  return data;
}