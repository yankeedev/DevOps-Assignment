import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SiteHeader() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <Link to="/" className="text-xl font-bold text-green-700 shrink-0">
          AgriRent
        </Link>

        <nav className="flex items-center gap-3 sm:gap-4 text-sm font-medium flex-wrap justify-end">
          <Link to="/equipment" className="text-gray-700 hover:text-green-700">
            Browse equipment
          </Link>

          {loading ? (
            <span className="text-gray-400">…</span>
          ) : user ? (
            <>
              {(user.role === 'buyer' || user.role === 'admin') && (
                <Link to="/dashboard" className="text-gray-700 hover:text-green-700">
                  Dashboard
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className="text-gray-700 hover:text-green-700">
                  Admin
                </Link>
              )}
              <span className="text-gray-500 hidden sm:inline">
                Hi, {user.name.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-800 hover:bg-gray-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-700 hover:text-green-700"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-green-700 px-3 py-1.5 text-white hover:bg-green-800"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
