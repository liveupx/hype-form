export default function TemplatesListPage() {
  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-display font-bold text-stone-900 mb-8">Templates</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Contact Form', 'Feedback Survey', 'Job Application', 'Event Registration', 'Lead Generation', 'Order Form'].map((template) => (
          <div key={template} className="card-hover overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-200" />
            <div className="p-4">
              <h3 className="font-semibold text-stone-900">{template}</h3>
              <button className="btn btn-secondary btn-sm mt-3 w-full">Use Template</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
