import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-black to-gray-900 overflow-hidden w-full min-h-[90vh] flex items-center">
        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.3),transparent_50%)]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full">
          <div className="max-w-4xl">
            <div className="inline-block bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-full text-sm font-medium mb-10 border border-white/10 text-white/90 tracking-wide">
              NEW COLLECTION 2026
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight text-white tracking-tighter">
              Experience
              <br />
              <span className="bg-gradient-to-r from-luxury-500 to-accent-purple bg-clip-text text-transparent">
                Luxury Shopping
              </span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl mb-14 text-white/70 max-w-2xl leading-relaxed font-normal">
              Curated collections from the world's finest brands. Delivered to your doorstep with unmatched service.
            </p>
            
            <div className="flex gap-4 flex-wrap items-center">
              <Link href="/products">
                <button className="bg-white text-black px-10 py-4 text-base font-semibold rounded-xl border-none cursor-pointer shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_6px_28px_rgba(255,255,255,0.3)] transition-all duration-300 ease-out tracking-wide hover:scale-105">
                  Explore Collection
                </button>
              </Link>
              <Link href="/register">
                <button className="bg-transparent text-white px-10 py-4 text-base font-semibold rounded-xl border-[1.5px] border-white/30 cursor-pointer backdrop-blur-md hover:bg-white/10 transition-all duration-300 ease-out tracking-wide">
                  Create Account
                </button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-10 mt-20 pt-12 border-t border-white/10 max-w-2xl">
              <div>
                <div className="text-4xl font-bold text-white mb-1">10K+</div>
                <div className="text-sm text-white/60 font-medium">Premium Products</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-1">50K+</div>
                <div className="text-sm text-white/60 font-medium">Happy Customers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-white/60 font-medium">Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-8 py-32 bg-white">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6 tracking-tighter">
            Why Choose ShopEase
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're redefining online shopping with exceptional quality and service
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-12 rounded-3xl border border-gray-200 hover:shadow-luxury transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-luxury-500 to-accent-purple" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-luxury-500 to-luxury-600 flex items-center justify-center mb-6 shadow-luxury group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-9M14 17H5M17 3l-7 7 7 7"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              Curated Selection
            </h3>
            <p className="text-gray-600 text-base leading-relaxed">
              Every product is carefully selected and verified to meet our highest standards of quality and authenticity.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-12 rounded-3xl border border-gray-200 hover:shadow-luxury transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-rose-500" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(236,72,153,0.2)] group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              Express Delivery
            </h3>
            <p className="text-gray-600 text-base leading-relaxed">
              Lightning-fast delivery with real-time tracking. Same-day options available in select areas.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-12 rounded-3xl border border-gray-200 hover:shadow-luxury transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(6,182,212,0.2)] group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              Secure Payments
            </h3>
            <p className="text-gray-600 text-base leading-relaxed">
              Bank-level encryption and multiple payment options ensure your transactions are always protected.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-b from-black to-gray-800 py-32 px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.2),transparent_70%)] opacity-50" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-bold text-white mb-6 tracking-tighter">
            Start Your Journey Today
          </h2>
          <p className="text-xl text-white/70 mb-12 leading-relaxed">
            Join our community of discerning shoppers and experience the future of retail.
          </p>
          <Link href="/products">
            <button className="bg-white text-black px-12 py-5 text-lg font-semibold rounded-xl border-none cursor-pointer shadow-[0_8px_32px_rgba(255,255,255,0.25)] hover:shadow-[0_12px_48px_rgba(255,255,255,0.35)] transition-all duration-300 ease-out tracking-wide hover:scale-105">
              Browse Products
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
