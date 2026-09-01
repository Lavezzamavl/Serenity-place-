import api from './client';

export async function getDispenseRecords() {
  const { data } = await api.get('/pharmacy/dispense-records/');
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function dispenseMedication(payload) {
  // payload: { drug, patient, quantity, unit_price, notes }
  const { data } = await api.post('/pharmacy/dispense-records/', payload);
  return data;
}