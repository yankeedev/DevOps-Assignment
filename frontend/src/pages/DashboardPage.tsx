import { useEffect, useState } from 'react'
import { fetchOwnerEquipment } from '../services/equipmentService'
import type { OwnerEquipment } from '../types/equipment'
import EquipmentCard from '../components/EquipmentCard'
import AddEquipmentForm from '../components/AddEquipmentForm'

// ─── Dev-only owner ID ────────────────────────────────────────────────────────
// Authentication is not yet implemented. This ID must match an existing User
// in the database with role=EQUIPMENT_OWNER. Replace this with the real user
// ID from your database, or set VITE_DEV_OWNER_ID in frontend/.env.local.
// Once authentication is implemented, this must come from the session token.
const DEV_OWNER_ID = import.meta.env.VITE_DEV_OWNER_ID as string | undefined

export default function DashboardPage() {
  const [equipment, setEquipment] = useState<OwnerEquipment[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const ownerId = DEV_OWNER_ID ?? ''

  useEffect(() => {
    if (!ownerId) {
      setError('No owner ID configured. Set VITE_DEV_OWNER_ID in frontend/.env.local to your User ID.')
      setLoading(false)
      return
    }
    fetchOwnerEquipment(ownerId)
      .then(setEquipment)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load your equipment'))
      .finally(() => setLoading(false))
  }, [ownerId])

  function handleSuccess(created: OwnerEquipment) {
    setEquipment(prev => [created, ...prev])
    setShowForm(false)
    setSuccessMsg(`"${created.name}" submitted successfully. It is now awaiting admin approval.`)
    setTimeout(() => setSuccessMsg(null), 6000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-700">AgriRent</h1>
          <a href="/" className="text-sm text-green-700 hover:underline font-medium">
            ← Browse Equipment
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Owner Dashboard</h2>
            <p className="text-gray-500 mt-1">Manage your farming equipment listings</p>
          </div>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setSuccessMsg(null) }}
              className="bg-green-700 hover:bg-green-800 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
            >
              + Add Farming Tool
            </button>
          )}
        </div>

        {successMsg && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
            ✓ {successMsg}
          </div>
        )}

        {showForm && (
          <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Farming Tool</h3>
            <AddEquipmentForm
              ownerId={ownerId}
              onSuccess={handleSuccess}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && equipment.length === 0 && !showForm && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg font-medium">No equipment listed yet</p>
            <p className="text-sm mt-1">Click <strong>Add Farming Tool</strong> to submit your first listing.</p>
          </div>
        )}

        {!loading && !error && equipment.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map(item => (
              <EquipmentCard key={item.id} equipment={item} showStatus />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
