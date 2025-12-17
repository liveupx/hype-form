import { Link } from 'react-router-dom';

export default function FormsListPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900">My Forms</h1>
          <p className="text-stone-600 mt-1">Manage and create forms</p>
        </div>
        <button className="btn btn-primary btn-md">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Form
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create new form card */}
        <button className="card border-2 border-dashed border-stone-300 hover:border-primary-400 hover:bg-primary-50 transition-colors p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="font-medium text-stone-600">Create new form</p>
        </button>

        {/* Sample forms */}
        {[
          { title: 'Customer Feedback', responses: 45, updated: '2 hours ago' },
          { title: 'Contact Form', responses: 128, updated: 'Yesterday' },
          { title: 'Event Registration', responses: 67, updated: '3 days ago' },
        ].map((form) => (
          <Link key={form.title} to="/dashboard/forms/1" className="card-hover overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-stone-100 to-stone-200" />
            <div className="p-4">
              <h3 className="font-semibold text-stone-900">{form.title}</h3>
              <div className="flex items-center justify-between mt-2 text-sm text-stone-500">
                <span>{form.responses} responses</span>
                <span>{form.updated}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
