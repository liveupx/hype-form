import { useAuthStore } from '../../stores/authStore';

export default function BillingPage() {
  const { user } = useAuthStore();

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-display font-bold text-stone-900 mb-8">Billing</h1>
      
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-stone-900">Current Plan</h2>
            <p className="text-stone-600 mt-1">
              You're on the <span className="font-medium">{user?.plan || 'Free'}</span> plan
            </p>
          </div>
          {user?.plan === 'FREE' && (
            <button className="btn btn-primary btn-md">Upgrade to Pro</button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6 border-2 border-stone-200">
          <h3 className="font-semibold text-stone-900 mb-2">Free</h3>
          <p className="text-3xl font-bold text-stone-900 mb-4">$0<span className="text-lg font-normal text-stone-500">/mo</span></p>
          <ul className="space-y-2 text-sm text-stone-600">
            <li>✓ Unlimited forms</li>
            <li>✓ Unlimited responses</li>
            <li>✓ Basic integrations</li>
            <li>✗ Custom branding</li>
            <li>✗ Payment collection</li>
          </ul>
        </div>
        <div className="card p-6 border-2 border-primary-500 relative">
          <span className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded-bl-lg">Popular</span>
          <h3 className="font-semibold text-stone-900 mb-2">Pro</h3>
          <p className="text-3xl font-bold text-stone-900 mb-4">$10<span className="text-lg font-normal text-stone-500">/mo</span></p>
          <ul className="space-y-2 text-sm text-stone-600">
            <li>✓ Everything in Free</li>
            <li>✓ Remove branding</li>
            <li>✓ Custom domains</li>
            <li>✓ Payment collection</li>
            <li>✓ Priority support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
