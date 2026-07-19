// Defines every role and exactly which sidebar modules they can see.
// This is a MOCK permission map for the demo — in the real build, this
// data will come from the backend (Role + Permission tables), not a
// hardcoded file. But the UI behavior is identical either way.

export const ROLES = {
  super_admin: {
    label: 'Super Administrator',
    modules: ['dashboard', 'patients', 'emr', 'pharmacy', 'nursing', 'lab', 'billing', 'inventory', 'hr', 'reports', 'settings'],
  },
  director: {
    label: 'Director',
    modules: ['dashboard', 'patients', 'emr', 'billing', 'reports', 'hr'],
  },
  psychiatrist: {
    label: 'Psychiatrist',
    modules: ['dashboard', 'patients', 'emr', 'reports'],
  },
  nurse: {
    label: 'Nurse',
    modules: ['dashboard', 'patients', 'nursing', 'emr'],
  },
  receptionist: {
    label: 'Receptionist',
    modules: ['dashboard', 'patients'],
  },
  pharmacist: {
    label: 'Pharmacist',
    modules: ['dashboard', 'pharmacy', 'inventory'],
  },
  accountant: {
    label: 'Accountant',
    modules: ['dashboard', 'billing', 'reports'],
  },
};

// Every module that exists in the system, and what it needs to render.
// icon names match lucide-react component names.
export const MODULES = [
  { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { key: 'patients', label: 'Patient Management', icon: 'Users' },
  { key: 'emr', label: 'EMR', icon: 'FileText' },
  { key: 'pharmacy', label: 'Pharmacy', icon: 'Pill' },
  { key: 'nursing', label: 'Nursing', icon: 'Stethoscope' },
  { key: 'lab', label: 'Laboratory', icon: 'FlaskConical' },
  { key: 'billing', label: 'Billing & Finance', icon: 'Receipt' },
  { key: 'inventory', label: 'Inventory & Stores', icon: 'Package' },
  { key: 'hr', label: 'Human Resources', icon: 'Briefcase' },
  { key: 'reports', label: 'Reports', icon: 'BarChart3' },
  { key: 'settings', label: 'Settings', icon: 'Settings' },
];