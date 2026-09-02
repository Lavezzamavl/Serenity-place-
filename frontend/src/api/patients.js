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

// Calls the backend's AI-assisted shift-handover summary for a patient.
// May take a few seconds since it's an outbound call to the Claude API.
export async function summarizePatient(id) {
  const { data } = await api.post(`/patients/${id}/summarize/`);
  return data.summary;
}