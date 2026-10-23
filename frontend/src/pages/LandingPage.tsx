import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[var(--color-charcoal)]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-black/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-white font-bold">
              AR
            </div>
            <span className="text-lg font-bold">AgriRent</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="hover:text-[var(--color-primary)]">Features</a>
            <a href="#how-it-works" className="hover:text-[var(--color-primary)]">How it works</a>
            <a href="#marketplace" className="hover:text-[var(--color-primary)]">Marketplace</a>
            <a href="#contact" className="hover:text-[var(--color-primary)]">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden px-3 py-2 text-sm font-medium hover:text-[var(--color-primary)] sm:inline-block">
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div>
            <p className="mb-4 inline-flex items-center rounded-full bg-[var(--color-sprout)]/40 px-3 py-1 text-sm font-medium text-[var(--color-primary-dark)]">
              Agricultural Marketplace & Linkage Platform
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Connect farmers to buyers across Africa
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[var(--color-slate)]">
              AgriRent helps farmers list their produce, reach verified buyers and build direct market linkages with less hassle. Built for real African agricultural trade.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="rounded-lg bg-[var(--color-primary)] px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)]"
              >
                List or buy produce
              </Link>
              <Link
                to="/equipment"
                className="rounded-lg border border-black/10 px-6 py-3 text-base font-semibold transition hover:bg-[var(--color-cloud)]"
              >
                Browse marketplace
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 -top-10 h-72 w-72 rounded-full bg-[var(--color-sprout)]/30 blur-3xl" />
            <div className="absolute -bottom-16 -right-10 h-72 w-72 rounded-full bg-[var(--color-primary-light)]/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-black/5 shadow-xl">
              <div className="aspect-[4/3] w-full bg-gradient-to-br from-[var(--color-primary)]/10 via-white to-[var(--color-sprout)]/40">
                <div className="flex h-full items-center justify-center p-6 text-center">
                  <div>
                    <p className="text-lg font-semibold">Agricultural Marketplace</p>
                    <p className="mt-2 text-sm text-[var(--color-slate)]">
                      Farm produce • Market linkages • Middleware driven listings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 mt-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-sm text-[var(--color-slate)] sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} AgriRent. All rights reserved.</p>
          <p>DevOps Assignment Project</p>
        </div>
      </footer>
    </div>
  );
}
