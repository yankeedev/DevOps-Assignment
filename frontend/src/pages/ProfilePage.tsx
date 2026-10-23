import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import { useAuth } from '../context/AuthContext'

const roleLabels: Record<string, string> = {
  farmer: 'Farmer',
  buyer: 'Equipment owner',
  admin: 'Administrator',
}

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  const canManageTools = user.role === 'buyer' || user.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Your profile</h1>
        <p className="text-gray-500 mt-1">Account details and quick links</p>

        <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <div className="px-6 py-4 flex justify-between gap-4">
            <span className="text-sm text-gray-500">Name</span>
            <span className="text-sm font-medium text-gray-900 text-right">{user.name}</span>
          </div>
          <div className="px-6 py-4 flex justify-between gap-4">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-medium text-gray-900 text-right break-all">{user.email}</span>
          </div>
          <div className="px-6 py-4 flex justify-between gap-4">
            <span className="text-sm text-gray-500">Role</span>
            <span className="text-sm font-medium text-gray-900">{roleLabels[user.role] ?? user.role}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to="/equipment"
            className="text-center rounded-lg bg-green-700 px-5 py-2.5 text-white font-medium hover:bg-green-800"
          >
            Search &amp; browse tools
          </Link>
          {canManageTools && (
            <Link
              to="/dashboard"
              className="text-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-gray-800 font-medium hover:bg-gray-50"
            >
              Dashboard — add tools
            </Link>
          )}
          {user.role === 'admin' && (
            <Link
              to="/admin"
              className="text-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-gray-800 font-medium hover:bg-gray-50"
            >
              Admin panel
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
