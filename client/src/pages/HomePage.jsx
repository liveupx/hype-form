import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full text-primary-700 text-sm font-medium mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              New: AI-powered form generation
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-stone-900 mb-6 animate-slide-up">
              Build forms that
              <span className="block text-gradient">people love to fill</span>
            </h1>

            {/* Subheading */}
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-stone-600 mb-10 animate-slide-up animation-delay-100">
              Create beautiful, engaging forms in minutes. No coding required.
              Get more responses with our modern, conversational approach.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-200">
              <Link to="/register" className="btn btn-primary btn-lg w-full sm:w-auto">
                Get Started Free
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link to="/templates" className="btn btn-secondary btn-lg w-full sm:w-auto">
                View Templates
              </Link>
            </div>

            {/* Social proof */}
            <p className="mt-8 text-sm text-stone-500 animate-fade-in animation-delay-300">
              Trusted by 10,000+ teams worldwide
            </p>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary-100 to-transparent rounded-full blur-3xl opacity-50" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-stone-900 mb-4">
              Everything you need to collect data
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Powerful features to help you create, share, and analyze forms with ease.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🎨',
                title: 'Drag & Drop Builder',
                description: 'Build forms visually with our intuitive drag-and-drop interface. No coding required.',
              },
              {
                icon: '⚡',
                title: 'Lightning Fast',
                description: 'Optimized for speed. Your forms load instantly, anywhere in the world.',
              },
              {
                icon: '🔗',
                title: 'Powerful Integrations',
                description: 'Connect with Google Sheets, Slack, Zapier, and hundreds more apps.',
              },
              {
                icon: '📊',
                title: 'Real-time Analytics',
                description: 'Track views, completion rates, and identify drop-off points instantly.',
              },
              {
                icon: '🔒',
                title: 'Enterprise Security',
                description: 'SOC 2 compliant with end-to-end encryption. Your data is safe.',
              },
              {
                icon: '🌍',
                title: 'Share Anywhere',
                description: 'Embed forms on your site, share via link, or use a custom domain.',
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="card-hover p-6"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-stone-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-stone-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-6">
            Ready to build better forms?
          </h2>
          <p className="text-lg text-stone-400 mb-10">
            Join thousands of teams using HypeForm to collect data and grow their business.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Start for Free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
