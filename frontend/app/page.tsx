import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Hero Section */}
      <div style={{ 
        position: 'relative', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        overflow: 'hidden'
      }}>
        {/* Animated Background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
          backgroundSize: '40px 40px',
          animation: 'slide 20s linear infinite'
        }} />
        
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          padding: '6rem 1rem',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ 
              display: 'inline-block',
              backgroundColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              padding: '0.5rem 1.5rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '2rem',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              ✨ Welcome to the Future of Shopping
            </div>

            <h1 style={{ 
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              fontWeight: '900',
              marginBottom: '1.5rem',
              lineHeight: '1.1'
            }}>
              ShopEase
            </h1>
            
            <p style={{ 
              fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
              marginBottom: '3rem',
              color: 'rgba(255,255,255,0.9)',
              maxWidth: '42rem',
              margin: '0 auto 3rem'
            }}>
              Discover amazing products with unbeatable prices 🚀
            </p>
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Link href="/products">
                <button style={{
                  backgroundColor: 'white',
                  color: '#667eea',
                  padding: '1rem 2.5rem',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease'
                }}>
                  🛍️ Browse Products
                </button>
              </Link>
              <Link href="/register">
                <button style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  padding: '1rem 2.5rem',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  borderRadius: '12px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}>
                  ✨ Create Account
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ 
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '5rem 1rem'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2.5rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
            }}>
              <span style={{ fontSize: '2.5rem' }}>✓</span>
            </div>
            <h3 style={{ 
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#1f2937'
            }}>
              Premium Quality
            </h3>
            <p style={{ 
              color: '#6b7280',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              Handpicked products from trusted brands
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '2.5rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)'
            }}>
              <span style={{ fontSize: '2.5rem' }}>⚡</span>
            </div>
            <h3 style={{ 
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#1f2937'
            }}>
              Lightning Fast
            </h3>
            <p style={{ 
              color: '#6b7280',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              Same-day delivery available
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '2.5rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3)'
            }}>
              <span style={{ fontSize: '2.5rem' }}>🔒</span>
            </div>
            <h3 style={{ 
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#1f2937'
            }}>
              100% Secure
            </h3>
            <p style={{ 
              color: '#6b7280',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              Bank-level encryption
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '5rem 1rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '900',
            color: 'white',
            marginBottom: '1.5rem'
          }}>
            Ready to Start Shopping?
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255,255,255,0.9)',
            marginBottom: '2.5rem'
          }}>
            Join thousands of happy customers today!
          </p>
          <Link href="/products">
            <button style={{
              backgroundColor: 'white',
              color: '#667eea',
              padding: '1.25rem 3rem',
              fontSize: '1.25rem',
              fontWeight: '700',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease'
            }}>
              Explore Our Products →
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
