import api, { unwrapList } from './client';

export async function getInvoices() {
  const { data } = await api.get('/billing/');
  return unwrapList(data);
}

export async function createInvoice(patientId, items) {
  // items: [{ description, quantity, unit_price }]
  const { data } = await api.post('/billing/', { patient: patientId, items });
  return data;
}

export async function recordPayment(invoiceId, amount, method) {
  const { data } = await api.post('/billing/payments/', {
    invoice: invoiceId,
    amount,
    method,
  });
  return data;
}