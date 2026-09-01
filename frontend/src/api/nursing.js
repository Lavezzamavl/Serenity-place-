import api, { unwrapList } from './client';

// --- Notes ---------------------------------------------------------------

export async function getNursingNotes(patientId) {
  const { data } = await api.get(`/nursing/notes/?patient=${patientId}`);
  return unwrapList(data);
}

export async function addNursingNote(patientId, shift, note) {
  const { data } = await api.post('/nursing/notes/', { patient: patientId, shift, note });
  return data;
}

// --- Vitals ----------------------------------------------------------------

export async function addVitalsCheck(patientId, payload) {
  const { data } = await api.post('/nursing/vitals/', { patient: patientId, ...payload });
  return data;
}

export async function getVitalsChecks(patientId) {
  const { data } = await api.get(`/nursing/vitals/?patient=${patientId}`);
  return unwrapList(data);
}

// --- MAR ---------------------------------------------------------------

export async function getMarEntries(patientId) {
  const { data } = await api.get(`/nursing/mar/?patient=${patientId}`);
  return unwrapList(data);
}

export async function addMarEntry(patientId, payload) {
  const { data } = await api.post('/nursing/mar/', { patient: patientId, ...payload });
  return data;
}

// --- Consumables ---------------------------------------------------------

export async function getConsumableUsages(patientId) {
  const { data } = await api.get(`/nursing/consumables/?patient=${patientId}`);
  return unwrapList(data);
}

export async function addConsumableUsage(patientId, itemId, quantity) {
  const { data } = await api.post('/nursing/consumables/', {
    patient: patientId, item: itemId, quantity,
  });
  return data;
}