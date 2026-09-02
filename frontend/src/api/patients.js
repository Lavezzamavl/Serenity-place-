import api, { unwrapList } from './client';

export async function getPatients(status) {
  const params = status ? { status } : {};
  const { data } = await api.get('/patients/', { params });
  return unwrapList(data);
}

export async function createPatient(payload) {
  const { data } = await api.post('/patients/', payload);
  return data;
}

export async function dischargePatient(id) {
  const { data } = await api.post(`/patients/${id}/discharge/`);
  return data;
}

export async function readmitPatient(id) {
  const { data } = await api.post(`/patients/${id}/readmit/`);
  return data;
}