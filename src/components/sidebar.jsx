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