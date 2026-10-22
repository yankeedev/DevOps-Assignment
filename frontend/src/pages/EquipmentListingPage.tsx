import { useEffect, useState } from 'react'
import { fetchAvailableEquipment } from '../services/equipmentService'
import type { PublicEquipment } from '../types/equipment'
import EquipmentCard from '../components/EquipmentCard'

export default function EquipmentListingPage() {
  const [equipment, setEquipment] = useState<PublicEquipment[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    fetchAvailableEquipment()
      .then(setEquipment)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load equipment'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-700">AgriRent</h1>
          <a href="/dashboard" className="text-sm text-green-700 hover:underline font-medium">
            Owner Dashboard →
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Available Farming Equipment</h2>
          <p className="text-gray-500 mt-1">Browse approved equipment available for rental across Rwanda</p>
        </div>

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

        {!loading && !error && equipment.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg font-medium">No equipment available right now</p>
            <p className="text-sm mt-1">Check back later — new tools are reviewed and approved regularly.</p>
          </div>
        )}

        {!loading && !error && equipment.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map(item => (
              <EquipmentCard key={item.id} equipment={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
