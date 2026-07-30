import * as Icons from 'lucide-react';

export default function Sidebar({ user, activeModule, setActiveModule }) {
  // user.role now comes from the real API (RoleSerializer), shaped like:
  // { id, name, permissions: [{ module: { key, label, icon }, can_view, ... }] }
  // instead of the old hardcoded ROLES[user.role] lookup.
  const permissions = user.role?.permissions || [];
  const visibleModules = permissions
    .filter((p) => p.can_view)
    .map((p) => p.module);

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
        {visibleModules.length === 0 && (
          <p className="text-white/40 text-xs px-3 py-4">
            No modules assigned to this role yet.
          </p>
        )}
      </nav>

      {/* Role badge at the bottom - reinforces the RBAC story visually */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="bg-white/5 rounded-lg px-3 py-2.5">
          <p className="text-white/40 text-[10px] uppercase tracking-wide">Signed in as</p>
          <p className="text-white text-sm font-medium truncate">{user.role?.name || 'No role assigned'}</p>
          <p className="text-white/50 text-xs">{visibleModules.length} modules visible</p>
        </div>
      </div>
    </aside>
  );
}