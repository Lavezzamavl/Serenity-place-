import api from './client';

export async function getProgressNotes(patientAdmissionId) {
  const { data } = await api.get(`/patients/progress-notes/?patient=${patientAdmissionId}`);
  return data;
}

export async function addProgressNote(patientId, note) {
  const { data } = await api.post('/patients/progress-notes/', {
    patient: patientId,
    note,
  });
  return data;
}