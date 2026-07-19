import { LogOut, Bell } from 'lucide-react';

export default function Topbar({ user, onLogout, moduleLabel }) {
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h2 className="font-display text-lg font-medium text-harbor">
        {moduleLabel}
      </h2>

      <div className="flex items-center gap-4">
        <button className="relative text-slate hover:text-harbor transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-sage rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-serenity text-white flex items-center justify-center text-sm font-medium">
            {initials}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-harbor">{user.name}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-slate hover:text-red-500 transition-colors ml-2"
            title="Sign out"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
}