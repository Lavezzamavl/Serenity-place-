import api, { unwrapList } from './client';

export async function getDrugs() {
  const { data } = await api.get('/pharmacy/');
  return unwrapList(data);
}

export async function dispenseMedication(payload) {
  // payload: { drug, patient, quantity, notes }
  const { data } = await api.post('/pharmacy/dispense-records/', payload);
  return data;
}

export async function addStock(payload) {
  // payload: { drug, quantity, batch_number, supplier, buying_price, selling_price, notes }
  const { data } = await api.post('/pharmacy/stock-additions/', payload);
  return data;
}