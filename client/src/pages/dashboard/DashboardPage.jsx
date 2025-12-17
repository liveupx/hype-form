import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-stone-900">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-stone-600 mt-1">Here's what's happening with your forms</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Forms', value: '12', change: '+2 this week' },
          { label: 'Total Responses', value: '1,234', change: '+89 this week' },
          { label: 'Completion Rate', value: '68%', change: '+5% vs last week' },
          { label: 'Active Forms', value: '8', change: '' },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-sm text-stone-500">{stat.label}</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{stat.value}</p>
            {stat.change && <p className="text-xs text-green-600 mt-1">{stat.change}</p>}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Quick actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/dashboard/forms" className="card-hover p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">📝</div>
            <div>
              <p className="font-medium text-stone-900">Create new form</p>
              <p className="text-sm text-stone-500">Start from scratch</p>
            </div>
          </Link>
          <Link to="/dashboard/templates" className="card-hover p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📋</div>
            <div>
              <p className="font-medium text-stone-900">Use a template</p>
              <p className="text-sm text-stone-500">Get started quickly</p>
            </div>
          </Link>
          <Link to="/dashboard/integrations" className="card-hover p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">🔗</div>
            <div>
              <p className="font-medium text-stone-900">Connect apps</p>
              <p className="text-sm text-stone-500">Set up integrations</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
