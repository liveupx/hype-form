export default function FormBuilderPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-4 border-b border-stone-200">
          <h2 className="font-semibold text-stone-900">Form Builder</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <p className="text-sm text-stone-500 mb-4">Drag fields to add</p>
          {/* Field types */}
          {['Short Text', 'Long Text', 'Email', 'Phone', 'Number', 'Date', 'Rating'].map((field) => (
            <div key={field} className="p-3 mb-2 bg-stone-50 rounded-lg border border-stone-200 cursor-grab hover:border-primary-400 hover:bg-primary-50 transition-colors">
              {field}
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-stone-100 overflow-auto">
        <div className="max-w-2xl mx-auto p-8">
          <div className="card p-8 min-h-[400px] flex items-center justify-center">
            <div className="text-center text-stone-400">
              <div className="text-4xl mb-4">📝</div>
              <p className="font-medium">Drag fields here to build your form</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
