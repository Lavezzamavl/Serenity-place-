import api from './client';

export async function getDrugs() {
  const { data } = await api.get('/pharmacy/');
  return data;
}

export async function dispenseMedication(payload) {
  // payload: { drug, patient, quantity, notes }
  const { data } = await api.post('/pharmacy/dispense-records/', payload);
  return data;
}