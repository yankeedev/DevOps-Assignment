import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAvailableEquipment } from '../services/equipmentService'
import type { PublicEquipment } from '../types/equipment'
import EquipmentCard from '../components/EquipmentCard'
import SiteHeader from '../components/SiteHeader'

export default function EquipmentListingPage() {
  const { user } = useAuth()
  const [equipment, setEquipment] = useState<PublicEquipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    fetchAvailableEquipment()
      .then(setEquipment)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load equipment'))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const set = new Set(equipment.map(e => e.category).filter(Boolean))
    return Array.from(set).sort()
  }, [equipment])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return equipment.filter(item => {
      if (categoryFilter && item.category !== categoryFilter) return false
      if (!q) return true
      const haystack = [
        item.name,
        item.description,
        item.category,
        item.district,
        item.sector,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [equipment, search, categoryFilter])

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available farming equipment</h2>
            <p className="text-gray-500 mt-1">
              Search and browse approved tools available for rental across Rwanda
            </p>
          </div>
          <Link
            to={user ? '/dashboard' : '/login'}
            className="shrink-0 text-center rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-800"
          >
            Add your tool
          </Link>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, category, district, or sector…"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600 sm:w-48"
          >
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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

        {!loading && !error && equipment.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium">No tools match your search</p>
            <p className="text-sm mt-1">Try different keywords or clear the category filter.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Showing {filtered.length} of {equipment.length} tool{equipment.length === 1 ? '' : 's'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(item => (
                <EquipmentCard key={item.id} equipment={item} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
