import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import { useAuth } from '../context/AuthContext'

export default function LandingPage() {
  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
              Rwanda farming rentals
            </p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              Rent the equipment you need. Share what you own.
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              AgriRent connects farmers with approved equipment owners across Rwanda.
              Browse available tools, list your machinery, and manage rentals in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/equipment"
                className="rounded-lg bg-green-700 px-5 py-2.5 text-white font-medium hover:bg-green-800"
              >
                Browse equipment
              </Link>
              {!loading && !user && (
                <Link
                  to="/register"
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-gray-800 font-medium hover:bg-gray-50"
                >
                  Create free account
                </Link>
              )}
              {!loading && user && (
                <Link
                  to="/profile"
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-gray-800 font-medium hover:bg-gray-50"
                >
                  Go to your profile
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-8">
            <div>
              <h2 className="font-semibold text-gray-900">For farmers</h2>
              <p className="mt-2 text-sm text-gray-600">
                Find tractors, ploughs, and other tools vetted by our team before they go live.
              </p>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">For owners</h2>
              <p className="mt-2 text-sm text-gray-600">
                Register as an equipment owner, submit listings, and track approval from your dashboard.
              </p>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Secure accounts</h2>
              <p className="mt-2 text-sm text-gray-600">
                Sign up or sign in to access your dashboard. Sign out anytime from the top navigation.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
