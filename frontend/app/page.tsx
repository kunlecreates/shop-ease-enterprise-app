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
          <div style={{
            backgroundColor: '#ffffff',
            padding: '3rem',
            borderRadius: '24px',
            border: '1px solid #e5e7eb',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #ec4899 0%, #f43f5e 100%)'
            }} />
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 24px rgba(236, 72, 153, 0.2)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h3 style={{ 
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#111827'
            }}>
              Express Delivery
            </h3>
            <p style={{ 
              color: '#6b7280',
              fontSize: '1rem',
              lineHeight: '1.7'
            }}>
              Lightning-fast delivery with real-time tracking. Same-day options available in select areas.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '3rem',
            borderRadius: '24px',
            border: '1px solid #e5e7eb',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)'
            }} />
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 24px rgba(6, 182, 212, 0.2)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 style={{ 
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#111827'
            }}>
              Secure Payments
            </h3>
            <p style={{ 
              color: '#6b7280',
              fontSize: '1rem',
              lineHeight: '1.7'
            }}>
              Bank-level encryption and multiple payment options ensure your transactions are always protected.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: 'linear-gradient(180deg, #000000 0%, #1a1a1a 100%)',
        padding: '8rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.2), transparent 70%)',
          opacity: 0.5
        }} />
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '1.5rem',
            letterSpacing: '-0.03em'
          }}>
            Start Your Journey Today
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255,255,255,0.7)',
            marginBottom: '3rem',
            lineHeight: '1.6'
          }}>
            Join our community of discerning shoppers and experience the future of retail.
          </p>
          <Link href="/products">
            <button style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              padding: '1.25rem 3rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(255,255,255,0.25)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              letterSpacing: '0.3px'
            }}>
              Browse Products
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
