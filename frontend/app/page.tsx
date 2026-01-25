import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%',
      margin: 0,
      padding: 0,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      background: '#ffffff'
    }}>
      {/* Hero Section */}
      <section style={{ 
        position: 'relative', 
        background: 'linear-gradient(180deg, #000000 0%, #1a1a1a 100%)',
        overflow: 'hidden',
        width: '100%',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* Mesh Gradient Background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.3), transparent 50%)',
          opacity: 0.4
        }} />
        
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '0 2rem',
          position: 'relative',
          zIndex: 10,
          width: '100%'
        }}>
          <div style={{ maxWidth: '900px' }}>
            <div style={{ 
              display: 'inline-block',
              backgroundColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              padding: '0.625rem 1.25rem',
              borderRadius: '100px',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '2.5rem',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '0.5px'
            }}>
              NEW COLLECTION 2026
            </div>

            <h1 style={{ 
              fontSize: 'clamp(3rem, 8vw, 6.5rem)',
              fontWeight: '700',
              marginBottom: '2rem',
              lineHeight: '1.05',
              color: '#ffffff',
              letterSpacing: '-0.04em'
            }}>
              Experience
              <br />
              <span style={{ 
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Luxury Shopping
              </span>
            </h1>
            
            <p style={{ 
              fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
              marginBottom: '3.5rem',
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '600px',
              lineHeight: '1.6',
              fontWeight: '400'
            }}>
              Curated collections from the world's finest brands. Delivered to your doorstep with unmatched service.
            </p>
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <Link href="/products">
                <button style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  padding: '1.125rem 2.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(255,255,255,0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  letterSpacing: '0.3px'
                }}>
                  Explore Collection
                </button>
              </Link>
              <Link href="/register">
                <button style={{
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  padding: '1.125rem 2.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  letterSpacing: '0.3px'
                }}>
                  Create Account
                </button>
              </Link>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '2.5rem',
              marginTop: '5rem',
              paddingTop: '3rem',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              maxWidth: '600px'
            }}>
              <div>
                <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.25rem' }}>10K+</div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>Premium Products</div>
              </div>
              <div>
                <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.25rem' }}>50K+</div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>Happy Customers</div>
              </div>
              <div>
                <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.25rem' }}>24/7</div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ 
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '8rem 2rem',
        background: '#ffffff'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: '700',
            color: '#000000',
            marginBottom: '1.5rem',
            letterSpacing: '-0.03em'
          }}>
            Why Choose ShopEase
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            We're redefining online shopping with exceptional quality and service
          </p>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          {/* Feature 1 */}
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
              background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)'
            }} />
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-9M14 17H5M17 3l-7 7 7 7"></path>
              </svg>
            </div>
            <h3 style={{ 
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#111827'
            }}>
              Curated Selection
            </h3>
            <p style={{ 
              color: '#6b7280',
              fontSize: '1rem',
              lineHeight: '1.7'
            }}>
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
