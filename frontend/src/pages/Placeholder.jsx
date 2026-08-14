import { Construction } from 'lucide-react';

export default function Placeholder() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-24">
      <div className="w-16 h-16 rounded-full bg-serenity/10 flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-serenity" />
      </div>
      <h3 className="font-display text-xl font-semibold text-harbor mb-2">
        Coming Online in Phase 2
      </h3>
      <p className="text-slate max-w-sm">
        This module is scoped and designed — full functionality rolls out
        as part of the 2-month build.
      </p>
    </div>
  );
}