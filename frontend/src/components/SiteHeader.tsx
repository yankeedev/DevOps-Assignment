import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'text-green-700 font-semibold'
    : 'text-gray-700 hover:text-green-700'

export default function SiteHeader() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  const canManageTools = user?.role === 'buyer' || user?.role === 'admin'

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <Link to="/" className="text-xl font-bold text-green-700 shrink-0">
          AgriRent
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5 text-sm font-medium flex-wrap justify-end">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/equipment" className={navLinkClass}>
            Browse tools
          </NavLink>

          {loading ? (
            <span className="text-gray-400">…</span>
          ) : user ? (
            <>
              <NavLink to="/profile" className={navLinkClass}>
                Profile
              </NavLink>
              {canManageTools && (
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
              )}
              {user.role === 'admin' && (
                <NavLink to="/admin" className={navLinkClass}>
                  Admin
                </NavLink>
              )}
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
              <Link to="/login" className="text-gray-700 hover:text-green-700">
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
