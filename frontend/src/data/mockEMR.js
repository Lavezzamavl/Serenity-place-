// Keyed by patient ID so EMR entries link directly to the patient record.
export const EMR_RECORDS = {
  'SPT-2026-0041': {
    diagnosis: 'Substance Use Disorder (Moderate) — DSM-5 F10.20',
    riskLevel: 'Moderate',
    vitals: { bp: '118/76', pulse: '72 bpm', temp: '36.7°C', weight: '74 kg', bmi: '23.1' },
    progressNotes: [
      { date: '2026-07-17', author: 'Dr. Wanjiru (Psychiatrist)', note: 'Patient stable, sleep improving. Continuing current medication plan.' },
      { date: '2026-07-16', author: 'Nurse Achieng', note: 'Vitals within normal range. Attended group therapy session.' },
      { date: '2026-07-15', author: 'Dr. Wanjiru (Psychiatrist)', note: 'Initial assessment complete. Started on treatment plan A.' },
    ],
    treatmentPlan: 'Phase 1 — Detox & Stabilization (Weeks 1–2), followed by Phase 2 Counseling.',
  },
  'SPT-2026-0042': {
    diagnosis: 'Major Depressive Disorder — DSM-5 F32.1',
    riskLevel: 'Low',
    vitals: { bp: '112/70', pulse: '68 bpm', temp: '36.5°C', weight: '61 kg', bmi: '21.4' },
    progressNotes: [
      { date: '2026-07-17', author: 'Dr. Otieno (Psychiatrist)', note: 'Mood improving, engaging well in individual counseling.' },
      { date: '2026-07-17', author: 'Counselor Njeri', note: 'First individual session completed. Good rapport established.' },
    ],
    treatmentPlan: 'Weekly individual counseling + bi-weekly psychiatric review.',
  },
};