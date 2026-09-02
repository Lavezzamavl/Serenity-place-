import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getDashboardSummary } from '../api/reports';

const TONE_CLASSES = {
  serenity: 'bg-serenity/10 text-serenity',
  sage: 'bg-sage/15 text-sage',
  slate: 'bg-slate/10 text-slate',
  red: 'bg-red-50 text-red-500',
};

const OCCUPANCY_COLORS = ['#3E7CB1', '#EAF1F6'];

function buildStats(data) {
  return [
    { label: 'Current Admissions', value: data.current_admissions, icon: 'Users', tone: 'serenity' },
    { label: 'Available Beds', value: data.available_beds, icon: 'BedDouble', tone: 'sage' },
    { label: 'New Admissions Today', value: data.new_admissions_today, icon: 'UserPlus', tone: 'serenity' },
    { label: 'Discharged (This Week)', value: data.discharged_this_week, icon: 'LogOut', tone: 'slate' },
    { label: 'Revenue (This Month)', value: `KES ${data.revenue_this_month.toLocaleString()}`, icon: 'TrendingUp', tone: 'sage' },
    { label: 'Outstanding Balances', value: `KES ${data.total_outstanding_balance.toLocaleString()}`, icon: 'AlertCircle', tone: 'red' },
    { label: 'Pharmacy Stock Alerts', value: data.pharmacy_stock_alerts, icon: 'Pill', tone: 'red' },
    { label: 'Inventory Stock Alerts', value: data.inventory_stock_alerts, icon: 'Package', tone: 'red' },
    { label: 'Active Staff', value: data.total_staff, icon: 'Briefcase', tone: 'serenity' },
    { label: 'Pending Leave Requests', value: data.pending_leave_requests, icon: 'CalendarClock', tone: 'slate' },
  ];
}

function timeAgo(timestamp) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Dashboard({ user }) {
  // Same fallback pattern as Topbar - first_name may be blank if the user
  // registered without filling it in, so fall back to username.
  const firstName = user.first_name || user.username;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardSummary()
      .then(setData)
      .catch(() => setError('Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-xl font-semibold text-harbor">
          Welcome back, {firstName}
        </h3>
        <p className="text-sm text-slate mt-0.5">Here's what's happening at Serenity Place today.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-slate">
          <Icons.Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading dashboard...
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-16 text-slate">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {buildStats(data).map((stat) => {
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 lg:col-span-1">
              <h4 className="font-medium text-harbor mb-4">Occupancy Rate</h4>
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Occupied', value: data.occupancy_rate },
                        { name: 'Available', value: Math.max(100 - data.occupancy_rate, 0) },
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={80}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {OCCUPANCY_COLORS.map((color) => (
                        <Cell key={color} fill={color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-display text-2xl font-semibold text-harbor">{data.occupancy_rate}%</span>
                  <span className="text-xs text-slate">occupied</span>
                </div>
              </div>
              <p className="text-xs text-slate text-center mt-2">
                {data.current_admissions} of {data.current_admissions + data.available_beds} beds in use
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 lg:col-span-1">
              <h4 className="font-medium text-harbor mb-4">Revenue Trend (KES, millions)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.revenue_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAF1F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5B6B79' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#5B6B79' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3E7CB1" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 lg:col-span-1">
              <h4 className="font-medium text-harbor mb-4">Admissions vs Discharges</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.admission_trend}>
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

          {/* Recent activity feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <Icons.Activity className="w-4 h-4 text-serenity" />
              <h4 className="font-medium text-harbor">Recent Activity</h4>
            </div>
            <div className="divide-y divide-gray-100">
              {data.recent_activity.length === 0 && (
                <p className="text-center py-8 text-slate/60 text-sm">No recent activity yet.</p>
              )}
              {data.recent_activity.map((entry) => (
                <div key={entry.id} className="px-5 py-3 flex items-start justify-between gap-4">
                  <p className="text-sm text-harbor">
                    <span className="font-medium">{entry.actor_name}</span>{' '}
                    <span className="text-slate">{entry.action.toLowerCase()}</span>{' '}
                    {entry.object_repr && <span className="text-slate">— {entry.object_repr}</span>}
                  </p>
                  <span className="text-xs text-slate/60 whitespace-nowrap">{timeAgo(entry.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
