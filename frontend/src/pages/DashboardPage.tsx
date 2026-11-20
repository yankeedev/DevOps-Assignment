import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchMyEquipment } from '../services/equipmentService'
import { fetchMyBookings, fetchIncomingBookings, cancelBooking, approveBooking, rejectBooking, type Booking } from '../services/bookingService'
import type { OwnerEquipment } from '../types/equipment'
import EquipmentCard from '../components/EquipmentCard'
import AddEquipmentForm from '../components/AddEquipmentForm'
import SiteHeader from '../components/SiteHeader'

type Tab = 'equipment' | 'my-rentals' | 'incoming'

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  APPROVED:  'bg-green-100 text-green-800',
  REJECTED:  'bg-red-100 text-red-800',
  ACTIVE:    'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const isOwner = user?.role === 'buyer' || user?.role === 'admin'

  const [tab, setTab] = useState<Tab>('equipment')
  const [equipment, setEquipment] = useState<OwnerEquipment[]>([])
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [incoming, setIncoming] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const promises: Promise<void>[] = []

    if (tab === 'equipment') {
      promises.push(
        fetchMyEquipment().then(setEquipment).catch(() => setError('Failed to load equipment'))
      )
    } else if (tab === 'my-rentals') {
      promises.push(
        fetchMyBookings().then(setMyBookings).catch(() => setError('Failed to load rentals'))
      )
    } else if (tab === 'incoming') {
      promises.push(
        fetchIncomingBookings().then(setIncoming).catch(() => setError('Failed to load requests'))
      )
    }

    Promise.all(promises).finally(() => setLoading(false))
  }, [tab])

  function handleEquipmentSuccess(created: OwnerEquipment) {
    setEquipment(prev => [created, ...prev])
    setShowForm(false)
    setSuccessMsg(`"${created.name}" submitted. Awaiting admin approval.`)
    setTimeout(() => setSuccessMsg(null), 6000)
  }

  async function handleCancel(id: string) {
    setActionBusy(id)
    try {
      await cancelBooking(id)
      setMyBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel')
    } finally {
      setActionBusy(null)
    }
  }

  async function handleIncoming(id: string, action: 'approve' | 'reject') {
    setActionBusy(id + action)
    try {
      if (action === 'approve') await approveBooking(id)
      else await rejectBooking(id)
      setIncoming(prev => prev.map(b =>
        b.id === id ? { ...b, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : b
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionBusy(null)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'equipment', label: isOwner ? 'My Equipment' : 'My Listings' },
    { key: 'my-rentals', label: 'My Rentals' },
    ...(isOwner ? [{ key: 'incoming' as Tab, label: 'Incoming Requests' }] : []),
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#212121]">Dashboard</h2>
            <p className="text-[#455A64] mt-1 text-sm">Manage your equipment and rentals</p>
          </div>
          {tab === 'equipment' && !showForm && (
            <button onClick={() => { setShowForm(true); setSuccessMsg(null) }}
              className="bg-[#4CAF50] hover:bg-[#2E7D32] text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors">
              + Add farming tool
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-[#B0BEC5] p-1 w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setError(null) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-[#2E7D32] text-white'
                  : 'text-[#455A64] hover:bg-[#F5F5F5]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {successMsg && (
          <div className="mb-6 rounded-lg border border-[#43A047] bg-[#43A047]/10 px-4 py-3 text-sm text-[#1B5E20]">
            ✓ {successMsg}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-[#E53935] bg-[#E53935]/10 px-4 py-3 text-sm text-[#E53935]">
            {error}
          </div>
        )}

        {/* Equipment tab */}
        {tab === 'equipment' && (
          <>
            {showForm && (
              <div className="mb-8 bg-white rounded-xl border border-[#B0BEC5] shadow-sm p-6">
                <h3 className="text-lg font-semibold text-[#212121] mb-4">Add new farming tool</h3>
                <AddEquipmentForm onSuccess={handleEquipmentSuccess} onCancel={() => setShowForm(false)} />
              </div>
            )}
            {loading && <Spinner />}
            {!loading && !error && equipment.length === 0 && !showForm && (
              <Empty title="No equipment listed yet" sub='Click "Add farming tool" to submit your first listing.' />
            )}
            {!loading && equipment.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {equipment.map(item => <EquipmentCard key={item.id} equipment={item} showStatus />)}
              </div>
            )}
          </>
        )}

        {/* My Rentals tab */}
        {tab === 'my-rentals' && (
          <>
            {loading && <Spinner />}
            {!loading && !error && myBookings.length === 0 && (
              <Empty title="No rental requests yet" sub="Browse equipment and submit a rental request." />
            )}
            {!loading && myBookings.length > 0 && (
              <div className="space-y-4">
                {myBookings.map(b => (
                  <div key={b.id} className="bg-white rounded-xl border border-[#B0BEC5] p-5 flex gap-4 items-start">
                    {b.equipment?.imageUrl && (
                      <img src={b.equipment.imageUrl} alt={b.equipment?.name}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-[#212121]">{b.equipment?.name}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[b.status] ?? ''}`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#455A64] mt-0.5">{b.equipment?.category} · {b.equipment?.district}, {b.equipment?.sector}</p>
                      <p className="text-sm text-[#455A64] mt-1">
                        {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-medium text-[#2E7D32] mt-0.5">
                        Total: RWF {Number(b.totalCost).toLocaleString()}
                      </p>
                    </div>
                    {b.status === 'PENDING' && (
                      <button onClick={() => handleCancel(b.id)} disabled={actionBusy === b.id}
                        className="text-xs text-[#E53935] border border-[#E53935] px-3 py-1.5 rounded-lg hover:bg-[#E53935]/10 disabled:opacity-50 flex-shrink-0">
                        {actionBusy === b.id ? '…' : 'Cancel'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Incoming Requests tab */}
        {tab === 'incoming' && (
          <>
            {loading && <Spinner />}
            {!loading && !error && incoming.length === 0 && (
              <Empty title="No incoming requests" sub="Rental requests for your equipment will appear here." />
            )}
            {!loading && incoming.length > 0 && (
              <div className="space-y-4">
                {incoming.map(b => (
                  <div key={b.id} className="bg-white rounded-xl border border-[#B0BEC5] p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-[#212121]">{b.equipment?.name}</h3>
                        <p className="text-xs text-[#455A64]">
                          Requested by <span className="font-medium">{b.farmer?.name}</span> ({b.farmer?.email})
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[b.status] ?? ''}`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#455A64]">
                      {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-medium text-[#2E7D32] mt-0.5">
                      RWF {Number(b.totalCost).toLocaleString()}
                    </p>
                    {b.status === 'PENDING' && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleIncoming(b.id, 'approve')}
                          disabled={actionBusy !== null}
                          className="bg-[#4CAF50] hover:bg-[#2E7D32] disabled:opacity-50 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors">
                          {actionBusy === b.id + 'approve' ? '…' : 'Approve'}
                        </button>
                        <button onClick={() => handleIncoming(b.id, 'reject')}
                          disabled={actionBusy !== null}
                          className="bg-[#E53935] hover:bg-[#E53935]/80 disabled:opacity-50 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors">
                          {actionBusy === b.id + 'reject' ? '…' : 'Reject'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
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
    <div className="text-center py-20">
      <p className="text-lg font-medium text-[#455A64]">{title}</p>
      <p className="text-sm mt-1 text-[#B0BEC5]">{sub}</p>
    </div>
  )
}
