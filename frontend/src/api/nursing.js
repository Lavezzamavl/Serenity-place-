import api from './client';

export async function getNursingNotes(patientId) {
  const { data } = await api.get(`/nursing/notes/?patient=${patientId}`);
  return data;
}

export async function addNursingNote(patientId, shift, note) {
  const { data } = await api.post('/nursing/notes/', { patient: patientId, shift, note });
  return data;
}

export async function addVitalsCheck(patientId, payload) {
  const { data } = await api.post('/nursing/vitals/', { patient: patientId, ...payload });
  return data;
}

export async function getVitalsChecks(patientId) {
  const { data } = await api.get(`/nursing/vitals/?patient=${patientId}`);
  return data;
}