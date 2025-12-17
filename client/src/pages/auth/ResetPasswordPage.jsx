export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-display font-bold text-stone-900 text-center mb-6">Set new password</h1>
        <form className="space-y-4">
          <div className="form-group">
            <label className="form-label">New password</label>
            <input type="password" className="input" minLength={8} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <input type="password" className="input" minLength={8} required />
          </div>
          <button type="submit" className="btn btn-primary w-full btn-md">Reset password</button>
        </form>
      </div>
    </div>
  );
}
