import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Dashboard from '../pages/Dashboard';
import Patients from '../pages/Patients';
import Placeholder from '../pages/Placeholder';
import { MODULES } from '../config/roles';

// Maps module key -> the component that renders it.
// Modules without a real build yet fall back to Placeholder.
const MODULE_COMPONENTS = {
  dashboard: Dashboard,
  patients: Patients,
};

export default function Layout({ user, activeModule, setActiveModule, onLogout }) {
  const activeModuleMeta = MODULES.find((m) => m.key === activeModule);
  const ActiveComponent = MODULE_COMPONENTS[activeModule] || Placeholder;

  return (
    <div className="flex h-screen bg-mist">
      <Sidebar
        user={user}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} onLogout={onLogout} moduleLabel={activeModuleMeta?.label} />

        <main className="flex-1 overflow-y-auto p-6">
          <ActiveComponent user={user} />
        </main>
      </div>
    </div>
  );
}