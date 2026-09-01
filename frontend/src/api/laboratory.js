import api, { unwrapList } from './client';

export async function getLabRequests(patientId) {
  const { data } = await api.get(`/laboratory/requests/${patientId ? `?patient=${patientId}` : ''}`);
  return unwrapList(data);
}

export async function createLabRequest(patientId, testName) {
  const { data } = await api.post('/laboratory/requests/', { patient: patientId, test_name: testName });
  return data;
}

export async function approveLabResult(id) {
  const { data } = await api.post(`/laboratory/requests/${id}/approve/`);
  return data;
}

export async function collectSample(id) {
  const { data } = await api.post(`/laboratory/requests/${id}/collect/`);
  return data;
}

export async function submitLabResult(id, resultText, file) {
  const formData = new FormData();
  if (resultText) formData.append('result', resultText);
  if (file) formData.append('result_file', file);
  const { data } = await api.post(`/laboratory/requests/${id}/submit_result/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}