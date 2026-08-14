import { FlaskConical, Download } from 'lucide-react';
import { LAB_REQUESTS } from '../data/mockLab';

const STATUS_STYLES = {
  'Result Ready': 'bg-sage/15 text-sage',
  'Sample Collected': 'bg-serenity/10 text-serenity',
  'Pending Approval': 'bg-amber-50 text-amber-600',
};

export default function Laboratory() {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-serenity" />
          <h4 className="font-medium text-harbor">Test Requests</h4>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-mist text-slate text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Request</th>
              <th className="text-left px-5 py-3 font-medium">Patient</th>
              <th className="text-left px-5 py-3 font-medium">Test</th>
              <th className="text-left px-5 py-3 font-medium">Requested By</th>
              <th className="text-left px-5 py-3 font-medium">Date</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {LAB_REQUESTS.map((r) => (
              <tr key={r.id} className="hover:bg-mist/50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-harbor">{r.id}</td>
                <td className="px-5 py-3 font-medium text-harbor">{r.patient}</td>
                <td className="px-5 py-3 text-slate">{r.test}</td>
                <td className="px-5 py-3 text-slate">{r.requestedBy}</td>
                <td className="px-5 py-3 text-slate">{r.date}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {r.status === 'Result Ready' && (
                    <button className="flex items-center gap-1 text-serenity text-xs font-medium hover:text-harbor">
                      <Download className="w-3.5 h-3.5" /> Report
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}