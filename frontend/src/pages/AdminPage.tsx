import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  fetchStats, fetchAllEquipment, fetchAllUsers, fetchAllBookings,
  approveEquipment, rejectEquipment,
  type AdminStats, type AdminEquipment, type AdminUser, type AdminBooking,
} from '../services/adminService'

type Tab = 'stats' | 'equipment' | 'users' | 'bookings'

const APPROVAL_COLORS: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

const BOOKING_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  APPROVED:  'bg-green-100 text-green-800',
  REJECTED:  'bg-red-100 text-red-800',
  ACTIVE:    'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default function AdminPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('stats')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [equipment, setEquipment] = useState<AdminEquipment[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [eqFilter, setEqFilter] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<AdminEquipment | null>(null)

  async function handleSignOut() {
    await logout()
    navigate('/', { replace: true })
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    const load = async () => {
      try {
        if (tab === 'stats') setStats(await fetchStats())
        else if (tab === 'equipment') setEquipment(await fetchAllEquipment(eqFilter || undefined))
        else if (tab === 'users') setUsers(await fetchAllUsers())
        else if (tab === 'bookings') setBookings(await fetchAllBookings())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tab, eqFilter])

  async function handleDecision(id: string, action: 'approve' | 'reject') {
    setProcessing(id + action)
    setError(null)
    try {
      if (action === 'approve') await approveEquipment(id)
      else await rejectEquipment(id)
      setEquipment(prev => prev.map(e =>
        e.id === id ? { ...e, approvalStatus: action === 'approve' ? 'APPROVED' : 'REJECTED' } : e
      ))
      showToast(`Equipment ${action === 'approve' ? 'approved' : 'rejected'}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setProcessing(null)
    }
  }

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true
    const q = userSearch.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  const tabs: { key: Tab; label: string }[] = [
    { key: 'stats', label: 'Overview' },
    { key: 'equipment', label: 'Equipment' },
    { key: 'users', label: 'Users' },
    { key: 'bookings', label: 'Bookings' },
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-[#1B5E20] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">AgriRent — Admin Panel</h1>
          <button onClick={handleSignOut}
            className="text-sm text-white border border-white/40 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-[#B0BEC5] p-1 w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setError(null) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-[#2E7D32] text-white' : 'text-[#455A64] hover:bg-[#F5F5F5]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {toast && (
          <div className="mb-4 rounded-lg border border-[#43A047] bg-[#43A047]/10 px-4 py-3 text-sm text-[#1B5E20]">✓ {toast}</div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-[#E53935] bg-[#E53935]/10 px-4 py-3 text-sm text-[#E53935]">{error}</div>
        )}
        {loading && <Spinner />}

        {/* Stats */}
        {!loading && tab === 'stats' && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.totalUsers },
              { label: 'Total Equipment', value: stats.totalEquipment },
              { label: 'Pending Approval', value: stats.pendingEquipment },
              { label: 'Approved', value: stats.approvedEquipment },
              { label: 'Rejected', value: stats.rejectedEquipment },
              { label: 'Total Bookings', value: stats.totalBookings },
              { label: 'Pending Bookings', value: stats.pendingBookings },
              { label: 'Active Rentals', value: stats.approvedBookings },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-[#B0BEC5] p-5">
                <p className="text-xs text-[#455A64]">{s.label}</p>
                <p className="text-3xl font-bold text-[#212121] mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Equipment */}
        {!loading && tab === 'equipment' && (
          <>
            <div className="flex gap-2 mb-4">
              {['', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                <button key={f} onClick={() => setEqFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    eqFilter === f
                      ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                      : 'bg-white text-[#455A64] border-[#B0BEC5] hover:bg-[#F5F5F5]'
                  }`}>
                  {f || 'All'}
                </button>
              ))}
            </div>
            {equipment.length === 0 && <Empty title="No equipment found" sub="" />}
            <div className="space-y-3">
              {equipment.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-[#B0BEC5] p-4 flex gap-4">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-xs text-[#B0BEC5] flex-shrink-0">No img</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-[#212121]">{item.name}</h3>
                        <p className="text-xs text-[#455A64]">{item.category} · {item.district}, {item.sector}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${APPROVAL_COLORS[item.approvalStatus] ?? ''}`}>
                        {item.approvalStatus}
                      </span>
                    </div>
                    <p className="text-xs text-[#B0BEC5] mt-1">
                      By {item.owner.name} ({item.owner.email}) · {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-medium text-[#2E7D32] mt-0.5">
                      RWF {Number(item.dailyPrice).toLocaleString()} / day
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
                      <button onClick={() => setDetailItem(item)}
                        className="text-xs border border-[#455A64] text-[#455A64] px-3 py-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors">
                        View
                      </button>
                      {item.approvalStatus === 'PENDING' && (
                        <>
                          <button onClick={() => handleDecision(item.id, 'approve')} disabled={processing !== null}
                            className="bg-[#4CAF50] hover:bg-[#2E7D32] disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                            {processing === item.id + 'approve' ? '…' : 'Approve'}
                          </button>
                          <button onClick={() => handleDecision(item.id, 'reject')} disabled={processing !== null}
                            className="bg-[#E53935] hover:bg-[#E53935]/80 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                            {processing === item.id + 'reject' ? '…' : 'Reject'}
                          </button>
                        </>
                      )}
                    </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Users */}
        {!loading && tab === 'users' && (
          <>
            <input type="search" placeholder="Search by name or email…" value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="mb-4 w-full max-w-sm rounded-lg border border-[#B0BEC5] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]" />
            {filteredUsers.length === 0 && <Empty title="No users found" sub="" />}
            <div className="bg-white rounded-xl border border-[#B0BEC5] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#F5F5F5] text-[#455A64]">
                  <tr>
                    {['Name', 'Email', 'Role', 'Joined'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-[#F5F5F5]/50">
                      <td className="px-4 py-3 font-medium text-[#212121]">{u.name}</td>
                      <td className="px-4 py-3 text-[#455A64]">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#A5D6A7]/40 text-[#1B5E20]">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#455A64]">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Bookings */}
        {!loading && tab === 'bookings' && (
          <>
            {bookings.length === 0 && <Empty title="No bookings yet" sub="" />}
            <div className="bg-white rounded-xl border border-[#B0BEC5] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#F5F5F5] text-[#455A64]">
                  <tr>
                    {['Equipment', 'Farmer', 'Dates', 'Cost', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-[#F5F5F5]/50">
                      <td className="px-4 py-3 font-medium text-[#212121]">{b.equipment.name}</td>
                      <td className="px-4 py-3 text-[#455A64]">{b.farmer.name}</td>
                      <td className="px-4 py-3 text-[#455A64] whitespace-nowrap">
                        {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-[#2E7D32] font-medium">
                        RWF {Number(b.totalCost).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${BOOKING_COLORS[b.status] ?? ''}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* Equipment Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetailItem(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-[#212121]">{detailItem.name}</h2>
              <button onClick={() => setDetailItem(null)} className="text-[#B0BEC5] hover:text-[#455A64] text-xl leading-none">&times;</button>
            </div>
            {detailItem.imageUrl && (
              <img src={detailItem.imageUrl} alt={detailItem.name} className="w-full h-48 object-cover rounded-xl mb-4" />
            )}
            <div className="space-y-2 text-sm">
              <Row label="Category" value={detailItem.category} />
              <Row label="Location" value={`${detailItem.district}, ${detailItem.sector}`} />
              <Row label="Daily Price" value={`RWF ${Number(detailItem.dailyPrice).toLocaleString()}`} />
              <Row label="Status" value={detailItem.status} />
              <Row label="Approval" value={detailItem.approvalStatus} />
              <Row label="Owner" value={`${detailItem.owner.name} (${detailItem.owner.email})`} />
              <Row label="Submitted" value={new Date(detailItem.createdAt).toLocaleDateString()} />
              <div className="pt-2">
                <p className="text-xs font-medium text-[#455A64] mb-1">Description</p>
                <p className="text-[#212121] text-sm leading-relaxed">{detailItem.description}</p>
              </div>
            </div>
            {detailItem.approvalStatus === 'PENDING' && (
              <div className="flex gap-3 mt-5">
                <button onClick={() => { handleDecision(detailItem.id, 'approve'); setDetailItem(null) }}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#2E7D32] text-white font-medium py-2 rounded-lg text-sm transition-colors">
                  Approve
                </button>
                <button onClick={() => { handleDecision(detailItem.id, 'reject'); setDetailItem(null) }}
                  className="flex-1 bg-[#E53935] hover:bg-[#E53935]/80 text-white font-medium py-2 rounded-lg text-sm transition-colors">
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="h-8 w-8 rounded-full border-4 border-[#2E7D32] border-t-transparent animate-spin" />
    </div>
  )
}

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-lg font-medium text-[#455A64]">{title}</p>
      {sub && <p className="text-sm mt-1 text-[#B0BEC5]">{sub}</p>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-[#455A64] w-24 flex-shrink-0">{label}</span>
      <span className="text-[#212121] font-medium">{value}</span>
    </div>
  )
}
