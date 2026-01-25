import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Hero Section with Bold Gradient */}
      <div style={{ 
        position: 'relative', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        overflow: 'hidden'
      }}>
        {/* Animated Background Pattern */}
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
            {/* Badge */}
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
              lineHeight: '1.1',
              background: 'linear-gradient(to right, #ffffff, #e0e7ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
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
              Discover amazing products with unbeatable prices and lightning-fast delivery 🚀
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
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)',
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

        {/* Wave Divider */}
        <div style={{ 
          position: 'absolute',
          bottom: '-1px',
          left: 0,
          width: '100%',
          overflow: 'hidden',
          lineHeight: 0
        }}>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ 
            width: '100%',
            height: '120px',
            fill: '#f9fafb'
          }}>
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
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
          {/* Feature Card 1 */}
          <div style={{
            backgroundColor: 'white',
            padding: '2.5rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
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
              Handpicked products from trusted brands. Every item is carefully vetted for quality and authenticity.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div style={{
            backgroundColor: 'white',
            padding: '2.5rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
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
              Get your orders delivered in record time. Same-day delivery available in select cities.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div style={{
            backgroundColor: 'white',
            padding: '2.5rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
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
              Bank-level encryption protects your data. Shop with confidence knowing your information is safe.
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
            Join thousands of happy customers and experience the future of online shopping today!
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
}