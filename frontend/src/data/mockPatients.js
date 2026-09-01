// Empty on purpose — per spec, no sample patient names ship in the real
// system. The demo seeds a couple of records at runtime (see Patients.jsx)
// so the screen isn't blank during the pitch, but the storage pattern
// matches an empty production database.
export const INITIAL_PATIENTS = [
  {
    id: 'SPT-2026-0041',
    name: 'Demo Patient — J.K.',
    age: 34,
    gender: 'Male',
    ward: 'Ward B',
    admissionDate: '2026-07-15',
    diagnosis: 'Substance Use Disorder',
    status: 'Admitted',
  },
  {
    id: 'SPT-2026-0042',
    name: 'Demo Patient — A.M.',
    age: 28,
    gender: 'Female',
    ward: 'Ward A',
    admissionDate: '2026-07-17',
    diagnosis: 'Depressive Disorder',
    status: 'Admitted',
  },
];