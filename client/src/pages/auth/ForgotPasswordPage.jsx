import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-stone-900">Reset password</h1>
          <p className="text-stone-600 mt-2">We'll send you a reset link</p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <p className="text-stone-600">Check your email for a reset link</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary w-full btn-md">Send reset link</button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-stone-600 mt-6">
          <Link to="/login" className="text-primary-600 hover:text-primary-700">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
