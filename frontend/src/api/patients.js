import api, { unwrapList } from './client';

export async function getPatients() {
  const { data } = await api.get('/patients/');
  return unwrapList(data);
}

export async function createPatient(payload) {
  const { data } = await api.post('/patients/', payload);
  return data;
}