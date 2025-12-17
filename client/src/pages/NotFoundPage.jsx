import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-display font-bold text-stone-900 mb-4">404</h1>
        <p className="text-xl text-stone-600 mb-8">Page not found</p>
        <Link to="/" className="btn btn-primary btn-md">Go Home</Link>
      </div>
    </div>
  );
}
