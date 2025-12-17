export default function IntegrationsPage() {
  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-display font-bold text-stone-900 mb-8">Integrations</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Google Sheets', icon: '📊', connected: true },
          { name: 'Slack', icon: '💬', connected: false },
          { name: 'Zapier', icon: '⚡', connected: false },
          { name: 'Webhooks', icon: '🔗', connected: true },
          { name: 'Stripe', icon: '💳', connected: false },
          { name: 'Calendly', icon: '📅', connected: false },
        ].map((integration) => (
          <div key={integration.name} className="card p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-3xl">{integration.icon}</div>
              <div>
                <h3 className="font-semibold text-stone-900">{integration.name}</h3>
                {integration.connected && <span className="badge badge-success text-xs">Connected</span>}
              </div>
            </div>
            <button className={`btn w-full btn-sm ${integration.connected ? 'btn-secondary' : 'btn-primary'}`}>
              {integration.connected ? 'Manage' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
