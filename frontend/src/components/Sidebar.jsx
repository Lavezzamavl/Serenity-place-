import * as Icons from 'lucide-react';
import { MODULES, ROLES } from '../config/roles';

export default function Sidebar({ user, activeModule, setActiveModule }) {
  const allowedKeys = ROLES[user.role]?.modules || [];
  const visibleModules = MODULES.filter((m) => allowedKeys.includes(m.key));

  return (
    <aside className="w-64 bg-harbor flex flex-col shrink-0">
      {/* Logo / system name */}
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="font-display text-white text-lg font-semibold leading-tight">
          Serenity Place
        </h1>
        <p className="text-white/50 text-xs mt-0.5">Treatment Center MS</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {visibleModules.map((mod) => {
          const Icon = Icons[mod.icon] || Icons.Circle;
          const isActive = activeModule === mod.key;
          return (
            <button
              key={mod.key}
              onClick={() => setActiveModule(mod.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-serenity text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="truncate">{mod.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Role badge at the bottom - reinforces the RBAC story visually */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="bg-white/5 rounded-lg px-3 py-2.5">
          <p className="text-white/40 text-[10px] uppercase tracking-wide">Signed in as</p>
          <p className="text-white text-sm font-medium truncate">{ROLES[user.role]?.label}</p>
          <p className="text-white/50 text-xs">{visibleModules.length} modules visible</p>
        </div>
      </div>
    </aside>
  );
}