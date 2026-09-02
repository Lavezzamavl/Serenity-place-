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

export async function recordPayment(invoiceId, amount, method, mpesaCode) {
  const { data } = await api.post('/billing/payments/', {
    invoice: invoiceId,
    amount,
    method,
    mpesa_code: mpesaCode || '',
  });
  return data;
}

export async function updatePaymentMpesaCode(paymentId, mpesaCode) {
  // Lets a payment's M-Pesa code be corrected after the fact -
  // it's the one field on a payment that stays editable post-capture.
  const { data } = await api.patch(`/billing/payments/${paymentId}/`, { mpesa_code: mpesaCode });
  return data;
}

export async function getInvoicePrintHtml(invoiceId) {
  // Returns raw HTML (not JSON) - the caller opens it in a new tab/window.
  // Fetched through axios (not a plain <a href>) so the JWT Authorization
  // header the interceptor attaches actually reaches this endpoint.
  const { data } = await api.get(`/billing/${invoiceId}/print/`, { responseType: 'text' });
  return data;
}

export async function chargeDailyBedFees() {
  // Admin-only. Charges every currently-Admitted patient a per-diem bed
  // fee for today, based on ward rates set in Facility Settings. Safe to
  // call more than once a day - the backend skips anyone already charged.
  const { data } = await api.post('/billing/charge-daily-fees/');
  return data;
}