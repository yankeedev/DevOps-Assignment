import { useEffect, useMemo, useState } from 'react'
import { fetchShops, type SupplyShop } from '../services/shopService'
import SiteHeader from '../components/SiteHeader'

const CATEGORY_LABELS: Record<string, string> = {
  SEEDS: 'Seeds', FERTILIZERS: 'Fertilizers', PESTICIDES: 'Pesticides',
  TOOLS: 'Tools', OTHER: 'Other',
}

const CATEGORY_COLORS: Record<string, string> = {
  SEEDS: 'bg-green-100 text-green-800',
  FERTILIZERS: 'bg-blue-100 text-blue-800',
  PESTICIDES: 'bg-red-100 text-red-800',
  TOOLS: 'bg-yellow-100 text-yellow-800',
  OTHER: 'bg-gray-100 text-gray-700',
}

export default function ShopsPage() {
  const [shops, setShops] = useState<SupplyShop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [expandedShop, setExpandedShop] = useState<string | null>(null)

  useEffect(() => {
    fetchShops()
      .then(setShops)
      .catch(() => setError('Failed to load shops'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return shops.filter(shop => {
      const matchesSearch = !q ||
        shop.name.toLowerCase().includes(q) ||
        shop.district.toLowerCase().includes(q) ||
        shop.sector.toLowerCase().includes(q) ||
        shop.products.some(p => p.name.toLowerCase().includes(q))
      const matchesCategory = !categoryFilter ||
        shop.products.some(p => p.category === categoryFilter)
      return matchesSearch && matchesCategory
    })
  }, [shops, search, categoryFilter])

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#212121]">Farm Supply Shops</h2>
          <p className="text-sm text-[#455A64] mt-1">Find seeds, fertilizers, tools and more near you</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by shop name, district, sector or product…"
            className="flex-1 rounded-lg border border-[#B0BEC5] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-[#B0BEC5] px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] sm:w-48">
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-4 border-[#2E7D32] border-t-transparent animate-spin" />
          </div>
        )}
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 text-[#455A64]">
            <p className="text-lg font-medium">No shops found</p>
            <p className="text-sm mt-1">Try different keywords or clear the filter.</p>
          </div>
        )}

        <div className="space-y-4">
          {filtered.map(shop => {
            const isOpen = expandedShop === shop.id
            const visibleProducts = categoryFilter
              ? shop.products.filter(p => p.category === categoryFilter)
              : shop.products
            return (
              <div key={shop.id} className="bg-white rounded-xl border border-[#B0BEC5] overflow-hidden">
                <button
                  onClick={() => setExpandedShop(isOpen ? null : shop.id)}
                  className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-[#F5F5F5] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[#212121]">{shop.name}</h3>
                      <span className="text-xs text-[#B0BEC5]">{shop.district}, {shop.sector}</span>
                    </div>
                    <p className="text-sm text-[#455A64] mt-0.5 line-clamp-1">{shop.description}</p>
                    <div className="flex gap-3 mt-1 text-xs text-[#455A64]">
                      <span>📞 {shop.phone}</span>
                      <span>📍 {shop.address}</span>
                      <span className="text-[#B0BEC5]">{shop.products.length} product{shop.products.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <span className="text-[#B0BEC5] text-lg flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-[#F5F5F5] px-5 pb-5">
                    {visibleProducts.length === 0 ? (
                      <p className="text-sm text-[#B0BEC5] pt-4">No products in this category.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                        {visibleProducts.map(p => (
                          <div key={p.id} className="rounded-lg border border-[#B0BEC5] p-3 flex flex-col gap-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-sm text-[#212121]">{p.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${CATEGORY_COLORS[p.category] ?? 'bg-gray-100 text-gray-700'}`}>
                                {CATEGORY_LABELS[p.category] ?? p.category}
                              </span>
                            </div>
                            <p className="text-xs text-[#455A64] line-clamp-2">{p.description}</p>
                            <div className="flex items-center justify-between mt-1 text-xs">
                              <span className="font-semibold text-[#2E7D32]">RWF {Number(p.price).toLocaleString()} / {p.unit}</span>
                              <span className="text-[#B0BEC5]">Qty: {p.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
