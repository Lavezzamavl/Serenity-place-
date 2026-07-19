import * as Icons from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { STATS, REVENUE_TREND, ADMISSION_TREND } from '../data/mockDashboard';

const TONE_CLASSES = {
  serenity: 'bg-serenity/10 text-serenity',
  sage: 'bg-sage/15 text-sage',
  slate: 'bg-slate/10 text-slate',
  red: 'bg-red-50 text-red-500',
};

export default function Dashboard({ user }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-xl font-semibold text-harbor">
          Welcome back, {user.name.split(' ')[0]}
        </h3>
        <p className="text-sm text-slate mt-0.5">Here's what's happening at Serenity Place today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = Icons[stat.icon] || Icons.Circle;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${TONE_CLASSES[stat.tone]}`}>
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <p className="font-display text-2xl font-semibold text-harbor">{stat.value}</p>
              <p className="text-xs text-slate mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h4 className="font-medium text-harbor mb-4">Revenue Trend (KES, millions)</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={REVENUE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAF1F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5B6B79' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#5B6B79' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#3E7CB1" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h4 className="font-medium text-harbor mb-4">Admissions vs Discharges</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ADMISSION_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAF1F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5B6B79' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#5B6B79' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="admissions" fill="#3E7CB1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="discharges" fill="#7FA895" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}