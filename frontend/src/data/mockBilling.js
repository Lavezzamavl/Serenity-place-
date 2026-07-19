export const INVOICES = [
  { id: 'INV-2026-0091', patient: 'Demo Patient — J.K.', patientId: 'SPT-2026-0041', date: '2026-07-17', items: 'Rehab Package (Weekly) + Medication', amount: 45000, paid: 45000, status: 'Paid' },
  { id: 'INV-2026-0092', patient: 'Demo Patient — A.M.', patientId: 'SPT-2026-0042', date: '2026-07-17', items: 'Rehab Package (Weekly) + Counseling', amount: 38000, paid: 20000, status: 'Partial' },
  { id: 'INV-2026-0093', patient: 'Demo Patient — J.K.', patientId: 'SPT-2026-0041', date: '2026-07-10', items: 'Psychiatric Review (Extra) + Consumables', amount: 6500, paid: 0, status: 'Outstanding' },
];

export const PAYMENT_METHODS_SUMMARY = [
  { method: 'M-Pesa', amount: 32000 },
  { method: 'Bank Transfer', amount: 25000 },
  { method: 'Cash', amount: 8000 },
];