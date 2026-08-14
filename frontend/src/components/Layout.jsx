import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Dashboard from '../pages/Dashboard';
import Patients from '../pages/Patients';
import EMR from '../pages/EMR';
import Pharmacy from '../pages/Pharmacy';
import Billing from '../pages/Billing';
import Laboratory from '../pages/Laboratory';
import Nursing from '../pages/Nursing';
import Inventory from '../pages/Inventory';
import HR from '../pages/HR';
import Reports from '../pages/Reports';
import SettingsPage from '../pages/SettingsPage';
import Placeholder from '../pages/Placeholder';
import { MODULES } from '../config/roles';

const MODULE_COMPONENTS = {
  dashboard: Dashboard,
  patients: Patients,
  emr: EMR,
  pharmacy: Pharmacy,
  billing: Billing,
  lab: Laboratory,
  nursing: Nursing,
  inventory: Inventory,
  hr: HR,
  reports: Reports,
  settings: SettingsPage,
};

export default function Layout({ user, activeModule, setActiveModule, onLogout }) {
  const activeModuleMeta = MODULES.find((m) => m.key === activeModule);
  const ActiveComponent = MODULE_COMPONENTS[activeModule] || Placeholder;

  return (
    <div className="flex h-screen bg-mist">
      <Sidebar user={user} activeModule={activeModule} setActiveModule={setActiveModule} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} onLogout={onLogout} moduleLabel={activeModuleMeta?.label} />
        <main className="flex-1 overflow-y-auto p-6">
          <ActiveComponent user={user} />
        </main>
      </div>
    </div>
  );
}