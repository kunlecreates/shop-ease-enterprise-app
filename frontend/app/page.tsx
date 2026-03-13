import Link from 'next/link';
import { Metadata } from 'next';
import HeroSlideshow from '@/components/HeroSlideshow';

export const metadata: Metadata = {
  title: 'ShopEase - Your Online Superstore',
  description: 'Shop fresh groceries, quality essentials, and household items delivered to your door. Your trusted online superstore.',
};

export default function HomePage() {
  return (
    <div className="bg-stone-50 dark:bg-slate-950">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden min-h-[620px] lg:min-h-[700px]">
        {/* Auto-cycling grocery superstore background */}
        <HeroSlideshow />

        {/* Gradient overlay — lighter than pure black, fades left-to-right */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-slate-800/60 via-slate-700/40 to-slate-600/15"
        />

        {/* Subtle indigo accent glow keeping brand colour */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 via-transparent to-slate-800/20"
        />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pb-32 lg:flex lg:items-center lg:gap-x-16 lg:px-8 lg:pt-32">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0">
            <div className="inline-flex items-center gap-x-2 rounded-full bg-indigo-500/10 px-4 py-1.5 ring-1 ring-inset ring-indigo-500/20 mb-8">
              <span className="text-xs font-semibold text-indigo-400 tracking-widest uppercase">New arrivals daily</span>
              <svg className="h-3.5 w-3.5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Premium groceries,{' '}
              <span className="text-indigo-400">delivered fresh</span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300 max-w-lg">
              Everything your household needs — from farm-fresh produce to everyday essentials — sourced with care and delivered to your door.
            </p>

            <div className="mt-10 flex items-center gap-x-4">
              <Link
                href="/products"
                className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors duration-200"
              >
                Browse products
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors duration-200 flex items-center gap-x-1"
              >
                Create free account
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Stats panel */}
          <div className="mx-auto mt-16 lg:mt-0 lg:flex-1">
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {[
                { value: '10,000+', label: 'Products in catalogue', description: 'Across every grocery category' },
                { value: '50,000+', label: 'Happy customers', description: 'And growing every week' },
                { value: 'Same-day', label: 'Delivery available', description: 'Order before 3 pm' },
                { value: '24 / 7', label: 'Customer support', description: 'Real humans, always on' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-6 backdrop-blur-md"
                >
                  <p className="text-3xl font-bold tracking-tight text-white">{stat.value}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">{stat.label}</p>
                  <p className="mt-1 text-xs text-slate-300">{stat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────────── */}
      <div className="border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[
              { label: 'Secure checkout', icon: (
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              )},
              { label: '100% satisfaction guarantee', icon: (
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              )},
              { label: 'Free shipping on orders over $50', icon: (
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              )},
              { label: 'Sourced from local farms', icon: (
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              )},
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-x-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase mb-3">
            Why ShopEase
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            A smarter way to shop for groceries
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Built around the things that matter most — quality, convenience, and transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Farm-fresh produce',
              description: 'Sourced directly from trusted local farms. Every item is picked for freshness and delivered within 24 hours of harvest.',
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-4.97 0-9 .5-9 5s4.03 5 9 5 9-.5 9-5-4.03-5-9-5zm0 10c-4.97 0-9 .5-9 5s4.03 5 9 5 9-.5 9-5-4.03-5-9-5zm0-5v5M9 9l3 3 3-3" />
                </svg>
              ),
            },
            {
              title: 'Same-day delivery',
              description: 'Order before 3 pm and receive your groceries at your door the same evening. No waiting, no planning ahead.',
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              ),
            },
            {
              title: 'Quality guaranteed',
              description: "Not satisfied with an item? We'll replace it or refund it — no questions asked. Your trust is our highest priority.",
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              ),
            },
            {
              title: 'In-store location finder',
              description: 'Every product lists its exact aisle, section, and shelf number — so you can pick up in-store without searching.',
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              ),
            },
            {
              title: 'Transparent pricing',
              description: 'No hidden fees, no surprise charges. The price you see at browse is the price you pay at checkout.',
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              ),
            },
            {
              title: '24/7 live support',
              description: 'Reach a real person at any time via chat, phone, or email. We are always available to resolve your issue.',
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              ),
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900 p-8 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all duration-200"
            >
              <div className="mb-5 inline-flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 p-3 text-indigo-600 dark:text-indigo-400">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase mb-3">
              Testimonials
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Trusted by thousands of households
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote: "I switched to ShopEase three months ago and haven't looked back. The produce quality is noticeably better than anywhere else I've tried.",
                name: 'Sarah M.',
                role: 'Customer since 2024',
              },
              {
                quote: "The same-day delivery is genuinely impressive. I ordered at 2 pm and dinner ingredients were at my door by 5:30. That kind of reliability is hard to find.",
                name: 'James O.',
                role: 'Customer since 2023',
              },
              {
                quote: "I love the in-store location feature. I can order online or just use the app to navigate straight to the shelf — saves me ten minutes every single trip.",
                name: 'Priya L.',
                role: 'Customer since 2025',
              },
            ].map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl bg-stone-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 p-8"
              >
                <svg className="h-6 w-6 text-indigo-400 mb-4" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                <blockquote className="text-sm leading-7 text-slate-700 dark:text-slate-300">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="bg-indigo-600 dark:bg-indigo-700">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to shop smarter?
            </h2>
            <p className="mt-3 text-lg text-indigo-100 max-w-xl">
              Join over 50,000 customers who receive fresh groceries and household essentials every week.
            </p>
          </div>
          <div className="mt-10 lg:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-shrink-0">
            <Link
              href="/products"
              className="rounded-lg bg-stone-50 px-6 py-3 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-stone-100 transition-colors duration-200"
            >
              Browse products
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white hover:text-indigo-100 transition-colors duration-200 flex items-center gap-x-1"
            >
              Create an account
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
