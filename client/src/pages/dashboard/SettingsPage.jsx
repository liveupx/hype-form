export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-display font-bold text-stone-900 mb-8">Settings</h1>
      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="font-semibold text-stone-900 mb-4">Account</h2>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" className="input" defaultValue="John Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="input" defaultValue="john@example.com" />
            </div>
          </div>
          <button className="btn btn-primary btn-md mt-4">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
