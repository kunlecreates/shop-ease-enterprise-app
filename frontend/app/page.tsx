import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShopEase - Your Online Superstore',
  description: 'Shop fresh groceries, quality essentials, and household items delivered to your door. Your trusted online superstore.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section - Vibrant & Modern */}
      <section className="relative overflow-hidden w-full min-h-[90vh] flex items-center">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-500 opacity-90 dark:opacity-80" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        </div>
        
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl px-6 py-3 rounded-full text-sm font-bold mb-8 border border-white/30 text-white shadow-2xl">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              NEW ARRIVALS DAILY
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 leading-tight text-white tracking-tighter drop-shadow-2xl">
              Fresh For
              <br />
              <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500 bg-clip-text text-transparent">
                Your Family
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-white/95 max-w-2xl leading-relaxed font-medium drop-shadow-lg">
              🥬 Fresh groceries, 🏠 quality essentials, and 🎯 everything you need delivered to your door
            </p>
            
            <div className="flex gap-4 flex-wrap items-center">
              <Link href="/products">
                <button className="bg-white text-gray-900 px-12 py-5 text-lg font-bold rounded-2xl border-none cursor-pointer shadow-2xl hover:shadow-3xl hover:bg-yellow-50 transition-all duration-300 ease-out tracking-wide hover:scale-105 hover:-translate-y-1">
                  🛒 Shop Now
                </button>
              </Link>
              <Link href="/register">
                <button className="bg-gray-900/80 backdrop-blur-md text-white px-12 py-5 text-lg font-bold rounded-2xl border-2 border-white/40 cursor-pointer hover:bg-gray-900 transition-all duration-300 ease-out tracking-wide hover:scale-105">
                  Join Free
                </button>
              </Link>
            </div>

            {/* Vibrant Stats */}
            <div className="grid grid-cols-3 gap-6 mt-16 pt-10 border-t-2 border-white/30 max-w-2xl">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                <div className="text-5xl font-black text-yellow-300 mb-2">10K+</div>
                <div className="text-sm text-white/90 font-semibold uppercase tracking-wider">Products</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                <div className="text-5xl font-black text-green-300 mb-2">50K+</div>
                <div className="text-sm text-white/90 font-semibold uppercase tracking-wider">Customers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                <div className="text-5xl font-black text-pink-300 mb-2">24/7</div>
                <div className="text-sm text-white/90 font-semibold uppercase tracking-wider">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Colorful Cards */}
      <section className="max-w-7xl mx-auto px-8 py-24 relative">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">
            Why Shop With Us? 🌟
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience grocery shopping reimagined for modern families
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 - Green/Fresh Theme */}
          <div className="group bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 p-10 rounded-3xl border-2 border-green-200 dark:border-green-700 hover:border-green-400 hover:shadow-2xl hover:shadow-green-200/50 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-xl shadow-green-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <span className="text-4xl">🥬</span>
            </div>
            <h3 className="text-2xl font-black mb-3 text-gray-900 dark:text-white">
              Farm Fresh Daily
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
              Sourced directly from local farms. Fresh produce delivered within 24 hours of harvest.
            </p>
          </div>

          {/* Feature 2 - Blue/Fast Theme */}
          <div className="group bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 p-10 rounded-3xl border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <span className="text-4xl">⚡</span>
            </div>
            <h3 className="text-2xl font-black mb-3 text-gray-900 dark:text-white">
              Lightning Delivery
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
              Same-day delivery available. Order before 3pm and get it by dinner time!
            </p>
          </div>

          {/* Feature 3 - Purple/Quality Theme */}
          <div className="group bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-10 rounded-3xl border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-200/50 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 shadow-xl shadow-purple-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <span className="text-4xl">✨</span>
            </div>
            <h3 className="text-2xl font-black mb-3 text-gray-900 dark:text-white">
              Quality Guaranteed
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
              100% satisfaction guarantee. Don't love it? We'll refund or replace it!
            </p>
          </div>

          {/* Feature 4 - Orange/Location Theme */}
          <div className="group bg-gradient-to-br from-orange-50 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 p-10 rounded-3xl border-2 border-orange-200 dark:border-orange-700 hover:border-orange-400 hover:shadow-2xl hover:shadow-orange-200/50 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center mb-6 shadow-xl shadow-orange-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <span className="text-4xl">📍</span>
            </div>
            <h3 className="text-2xl font-black mb-3 text-gray-900 dark:text-white">
              Find In-Store
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
              Every product shows exact aisle and shelf location for easy in-store pickup.
            </p>
          </div>

          {/* Feature 5 - Red/Price Theme */}
          <div className="group bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20 p-10 rounded-3xl border-2 border-red-200 dark:border-red-700 hover:border-red-400 hover:shadow-2xl hover:shadow-red-200/50 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mb-6 shadow-xl shadow-red-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <span className="text-4xl">💰</span>
            </div>
            <h3 className="text-2xl font-black mb-3 text-gray-900 dark:text-white">
              Best Prices
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
              Competitive prices + weekly deals. Save more on the things you buy most.
            </p>
          </div>

          {/* Feature 6 - Indigo/Support Theme */}
          <div className="group bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-indigo-900/20 dark:to-violet-900/20 p-10 rounded-3xl border-2 border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <span className="text-4xl">💬</span>
            </div>
            <h3 className="text-2xl font-black mb-3 text-gray-900 dark:text-white">
              24/7 Support
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
              Real humans ready to help anytime. Chat, call, or email - we're here!
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section - Vibrant Gradient */}
      <section className="relative py-32 px-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCA0NGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnpNMTIgMzZjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-sm font-bold mb-6 text-white">
            <span className="text-xl">🎉</span>
            SPECIAL OFFER
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter drop-shadow-2xl">
            Ready to Start?
          </h2>
          <p className="text-2xl text-white/95 mb-10 leading-relaxed font-medium drop-shadow-lg">
            Join 50,000+ satisfied customers enjoying fresh groceries delivered daily
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/products">
              <button className="bg-white text-violet-600 px-14 py-6 text-xl font-black rounded-2xl border-none cursor-pointer shadow-2xl hover:shadow-3xl hover:bg-yellow-50 transition-all duration-300 ease-out tracking-wide hover:scale-110 hover:-translate-y-2">
                Browse Products →
              </button>
            </Link>
            <Link href="/register">
              <button className="bg-transparent backdrop-blur-md text-white px-14 py-6 text-xl font-black rounded-2xl border-4 border-white cursor-pointer hover:bg-white hover:text-violet-600 transition-all duration-300 ease-out tracking-wide hover:scale-110 hover:-translate-y-2">
                Sign Up Free
              </button>
            </Link>
          </div>
          
          {/* Trust Badges */}
          <div className="flex gap-8 justify-center mt-16 flex-wrap">
            <div className="flex items-center gap-2 text-white/90 font-semibold">
              <span className="text-2xl">🔒</span>
              <span>Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2 text-white/90 font-semibold">
              <span className="text-2xl">⭐</span>
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2 text-white/90 font-semibold">
              <span className="text-2xl">🚚</span>
              <span>Free Shipping</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
