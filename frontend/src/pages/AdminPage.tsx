import { useEffect, useState } from 'react'
import {
  fetchPendingEquipment,
  approveEquipment,
  rejectEquipment,
  type PendingEquipment,
} from '../services/adminService'

export default function AdminPage() {
  const [items, setItems]           = useState<PendingEquipment[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [toast, setToast]           = useState<string | null>(null)

  useEffect(() => {
    fetchPendingEquipment()
      .then(setItems)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load pending equipment'))
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }

  async function handleDecision(id: string, action: 'approve' | 'reject') {
    setProcessing(id + action)
    setError(null)
    try {
      if (action === 'approve') await approveEquipment(id)
      else                      await rejectEquipment(id)
      setItems(prev => prev.filter(i => i.id !== id))
      showToast(`Equipment ${action === 'approve' ? 'approved' : 'rejected'} successfully.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setProcessing(null)
    }
  }

  return (
    // Cloud (#F5F5F5) background
    <div className="min-h-screen bg-[#F5F5F5]">

      {/* Header — Deep Forest (#1B5E20) background, White text */}
      <header className="bg-[#1B5E20] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#FFFFFF]">AgriRent — Admin</h1>
          <a
            href="/"
            className="text-sm text-[#A5D6A7] hover:text-[#FFFFFF] font-medium transition-colors"
          >
            ← Browse Equipment
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Page title — Charcoal (#212121) */}
        <h2 className="text-2xl font-bold text-[#212121] mb-1">Pending Tool Approvals</h2>
        {/* Subtitle — Slate (#455A64) */}
        <p className="text-sm text-[#455A64] mb-6">
          Review and approve or reject equipment submitted by users.
        </p>

        {/* Success toast — Success (#43A047) */}
        {toast && (
          <div className="mb-6 rounded-lg border border-[#43A047] bg-[#43A047]/10 px-4 py-3 text-sm text-[#1B5E20]">
            ✓ {toast}
          </div>
        )}

        {/* Error banner — Error (#E53935) */}
        {error && (
          <div className="mb-6 rounded-lg border border-[#E53935] bg-[#E53935]/10 px-4 py-3 text-sm text-[#E53935]">
            {error}
          </div>
        )}

        {/* Loading spinner — Leaf Green (#2E7D32) */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-4 border-[#2E7D32] border-t-transparent animate-spin" />
          </div>
        )}

        {/* Empty state — Slate (#455A64) */}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg font-medium text-[#455A64]">No pending submissions</p>
            <p className="text-sm mt-1 text-[#B0BEC5]">All equipment has been reviewed.</p>
          </div>
        )}

        {/* Equipment list */}
        {!loading && items.length > 0 && (
          <div className="space-y-4">
            {items.map(item => (
              // White (#FFFFFF) card, Stone (#B0BEC5) border
              <div
                key={item.id}
                className="bg-[#FFFFFF] rounded-xl border border-[#B0BEC5] shadow-sm p-5 flex gap-4"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  // Cloud (#F5F5F5) placeholder, Stone (#B0BEC5) text
                  <div className="w-24 h-24 rounded-lg flex-shrink-0 bg-[#F5F5F5] flex items-center justify-center text-xs text-[#B0BEC5]">
                    No image
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {/* Tool name — Charcoal (#212121) */}
                      <h3 className="font-semibold text-[#212121]">{item.name}</h3>
                      {/* Meta — Slate (#455A64) */}
                      <p className="text-xs text-[#455A64] mt-0.5">
                        {item.category} · {item.district}, {item.sector}
                      </p>
                    </div>
                    {/* Price — Leaf Green (#2E7D32) */}
                    <span className="text-sm font-medium text-[#2E7D32] whitespace-nowrap">
                      {Number(item.dailyPrice).toLocaleString()} RWF/day
                    </span>
                  </div>

                  {/* Description — Slate (#455A64) */}
                  <p className="text-sm text-[#455A64] mt-2 line-clamp-2">{item.description}</p>

                  {/* Submitter info — Stone (#B0BEC5) label, Slate (#455A64) value */}
                  <p className="text-xs text-[#B0BEC5] mt-2">
                    Submitted by{' '}
                    <span className="font-medium text-[#455A64]">{item.owner.name}</span>
                    {' '}({item.owner.email}) ·{' '}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
                  {/* Approve — Fresh Green (#4CAF50) → Deep Forest (#1B5E20) on hover */}
                  <button
                    onClick={() => handleDecision(item.id, 'approve')}
                    disabled={processing !== null}
                    className="bg-[#4CAF50] hover:bg-[#2E7D32] disabled:opacity-50 text-[#FFFFFF] text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    {processing === item.id + 'approve' ? '…' : 'Approve'}
                  </button>
                  {/* Reject — Error (#E53935) */}
                  <button
                    onClick={() => handleDecision(item.id, 'reject')}
                    disabled={processing !== null}
                    className="bg-[#E53935] hover:bg-[#E53935]/80 disabled:opacity-50 text-[#FFFFFF] text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    {processing === item.id + 'reject' ? '…' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
