import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  fetchShops, addProduct, updateProduct, deleteProduct,
  type SupplyShop, type SupplyProduct, type ProductCategory,
} from '../services/shopService'
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

const PRODUCT_CATEGORIES: ProductCategory[] = ['SEEDS', 'FERTILIZERS', 'PESTICIDES', 'TOOLS', 'OTHER']

export default function ShopsPage() {
  const { user } = useAuth()
  const [shops, setShops] = useState<SupplyShop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [expandedShop, setExpandedShop] = useState<string | null>(null)

  // product form state
  const [productFormShopId, setProductFormShopId] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<SupplyProduct | null>(null)
  const [productForm, setProductForm] = useState({ name: '', description: '', category: 'SEEDS' as ProductCategory, price: '', unit: '', quantity: '' })
  const [productBusy, setProductBusy] = useState(false)
  const [productError, setProductError] = useState<string | null>(null)

  useEffect(() => {
    fetchShops()
      .then(setShops)
      .catch(() => setError('Failed to load shops'))
      .finally(() => setLoading(false))
  }, [])

  function openAddProduct(shopId: string) {
    setProductForm({ name: '', description: '', category: 'SEEDS', price: '', unit: '', quantity: '' })
    setEditingProduct(null)
    setProductError(null)
    setProductFormShopId(shopId)
    setExpandedShop(shopId)
  }

  function openEditProduct(shopId: string, p: SupplyProduct) {
    setProductForm({ name: p.name, description: p.description, category: p.category, price: String(p.price), unit: p.unit, quantity: String(p.quantity) })
    setEditingProduct(p)
    setProductError(null)
    setProductFormShopId(shopId)
    setExpandedShop(shopId)
  }

  function closeProductForm() {
    setProductFormShopId(null)
    setEditingProduct(null)
    setProductError(null)
  }

  async function handleProductSubmit(e: React.FormEvent, shopId: string) {
    e.preventDefault()
    setProductBusy(true)
    setProductError(null)
    try {
      if (editingProduct) {
        const updated = await updateProduct(shopId, editingProduct.id, { ...productForm, quantity: Number(productForm.quantity) })
        setShops(prev => prev.map(s => s.id === shopId ? { ...s, products: s.products.map(p => p.id === updated.id ? updated : p) } : s))
      } else {
        const created = await addProduct(shopId, { ...productForm, quantity: Number(productForm.quantity) })
        setShops(prev => prev.map(s => s.id === shopId ? { ...s, products: [created, ...s.products] } : s))
      }
      closeProductForm()
    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'Failed to save product')
    } finally { setProductBusy(false) }
  }

  async function handleDeleteProduct(shopId: string, productId: string) {
    if (!window.confirm('Delete this product?')) return
    try {
      await deleteProduct(shopId, productId)
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, products: s.products.filter(p => p.id !== productId) } : s))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    }
  }

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
            const isOwner = user?.id === shop.ownerId
            const visibleProducts = categoryFilter
              ? shop.products.filter(p => p.category === categoryFilter)
              : shop.products
            return (
              <div key={shop.id} className="bg-white rounded-xl border border-[#B0BEC5] overflow-hidden">
                <div className="p-5 flex items-start justify-between gap-4">
                  <button
                    onClick={() => setExpandedShop(isOpen ? null : shop.id)}
                    className="flex-1 text-left min-w-0"
                  >
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
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isOwner && (
                      <button
                        onClick={() => openAddProduct(shop.id)}
                        className="bg-[#4CAF50] hover:bg-[#2E7D32] text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                        + Add product
                      </button>
                    )}
                    <span className="text-[#B0BEC5] text-lg">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-[#F5F5F5] px-5 pb-5">

                    {/* product form for owner */}
                    {isOwner && productFormShopId === shop.id && (
                      <form onSubmit={e => handleProductSubmit(e, shop.id)} className="mt-4 mb-4 p-4 rounded-lg border border-[#B0BEC5] bg-[#F5F5F5] space-y-3">
                        <p className="text-sm font-semibold text-[#212121]">{editingProduct ? 'Edit product' : 'New product'}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <PF label="Name"><input className={pi()} value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} required /></PF>
                          <PF label="Category">
                            <select className={pi()} value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value as ProductCategory }))}>
                              {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                            </select>
                          </PF>
                        </div>
                        <PF label="Description"><textarea className={pi()} rows={2} value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} required /></PF>
                        <div className="grid grid-cols-3 gap-3">
                          <PF label="Price (RWF)"><input type="number" min="1" className={pi()} value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} required /></PF>
                          <PF label="Unit"><input className={pi()} placeholder="kg, bag…" value={productForm.unit} onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))} required /></PF>
                          <PF label="Qty"><input type="number" min="0" className={pi()} value={productForm.quantity} onChange={e => setProductForm(p => ({ ...p, quantity: e.target.value }))} required /></PF>
                        </div>
                        {productError && <p className="text-xs text-[#E53935]">{productError}</p>}
                        <div className="flex gap-2">
                          <button type="submit" disabled={productBusy}
                            className="bg-[#4CAF50] hover:bg-[#2E7D32] disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                            {productBusy ? 'Saving…' : editingProduct ? 'Save changes' : 'Add product'}
                          </button>
                          <button type="button" onClick={closeProductForm}
                            className="px-4 py-2 rounded-lg border border-[#B0BEC5] text-[#455A64] text-sm hover:bg-white transition-colors">Cancel</button>
                        </div>
                      </form>
                    )}

                    {visibleProducts.length === 0 && productFormShopId !== shop.id ? (
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
                            {isOwner && (
                              <div className="flex gap-2 mt-1">
                                <button onClick={() => openEditProduct(shop.id, p)}
                                  className="text-xs border border-[#2E7D32] text-[#2E7D32] px-2 py-1 rounded-lg hover:bg-[#2E7D32]/10 transition-colors">Edit</button>
                                <button onClick={() => handleDeleteProduct(shop.id, p.id)}
                                  className="text-xs border border-[#E53935] text-[#E53935] px-2 py-1 rounded-lg hover:bg-[#E53935]/10 transition-colors">Delete</button>
                              </div>
                            )}
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

function pi() {
  return 'w-full rounded-lg border border-[#B0BEC5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white'
}

function PF({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-[#455A64]">{label}</label>
      {children}
    </div>
  )
}
