import api, { unwrapList } from './client';

export async function getCounselingSessions(patientId) {
  const { data } = await api.get(`/counseling/?patient=${patientId}`);
  return unwrapList(data);
}

export async function addCounselingSession(patientId, sessionType, notes) {
  const { data } = await api.post('/counseling/', {
    patient: patientId,
    session_type: sessionType,
    notes,
  });
  return data;
}