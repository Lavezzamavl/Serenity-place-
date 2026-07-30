import api from './client';

export async function getFacilitySettings() {
  const { data } = await api.get('/settings/');
  return data;
}

export async function updateFacilitySettings(payload) {
  const { data } = await api.put('/settings/', payload);
  return data;
}
