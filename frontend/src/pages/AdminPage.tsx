import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  fetchStats, fetchAllEquipment, fetchAllUsers, fetchAllBookings,
  approveEquipment, rejectEquipment,
  adminFetchShops, adminCreateShop, adminUpdateShop, adminDeleteShop,
  adminAddProduct, adminUpdateProduct, adminDeleteProduct,
  type AdminStats, type AdminEquipment, type AdminUser, type AdminBooking, type SupplyShop, type SupplyProduct,
} from '../services/adminService'

type Tab = 'stats' | 'equipment' | 'users' | 'bookings' | 'shops'

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

  // shops state
  const [shops, setShops] = useState<SupplyShop[]>([])
  const [shopFormOpen, setShopFormOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<SupplyShop | null>(null)
  const [shopForm, setShopForm] = useState({ name: '', description: '', phone: '', address: '', district: '', sector: '', ownerId: '' })
  const [expandedShop, setExpandedShop] = useState<string | null>(null)
  const [productFormShopId, setProductFormShopId] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<{ shopId: string; product: SupplyProduct } | null>(null)
  const [productForm, setProductForm] = useState({ name: '', description: '', category: 'SEEDS', price: '', unit: '', quantity: '' })
  const [shopBusy, setShopBusy] = useState(false)

  async function handleSignOut() {
    await logout()
    navigate('/', { replace: true })
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }

  useEffect(() => {
    // always load users so the shop owner dropdown is populated
    fetchAllUsers().then(setUsers).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const load = async () => {
      try {
        if (tab === 'stats') setStats(await fetchStats())
        else if (tab === 'equipment') setEquipment(await fetchAllEquipment(eqFilter || undefined))
        else if (tab === 'users') setUsers(await fetchAllUsers())
        else if (tab === 'bookings') setBookings(await fetchAllBookings())
        else if (tab === 'shops') setShops(await adminFetchShops())
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

  // shop handlers
  function openCreateShop() {
    setShopForm({ name: '', description: '', phone: '', address: '', district: '', sector: '', ownerId: '' })
    setEditingShop(null)
    setShopFormOpen(true)
  }
  function openEditShop(s: SupplyShop) {
    setShopForm({ name: s.name, description: s.description, phone: s.phone, address: s.address, district: s.district, sector: s.sector, ownerId: s.ownerId })
    setEditingShop(s)
    setShopFormOpen(true)
  }
  async function handleShopSubmit(e: React.FormEvent) {
    e.preventDefault()
    setShopBusy(true)
    try {
      if (editingShop) {
        const updated = await adminUpdateShop(editingShop.id, shopForm)
        setShops(prev => prev.map(s => s.id === updated.id ? updated : s))
        showToast('Shop updated.')
      } else {
        const created = await adminCreateShop(shopForm)
        setShops(prev => [created, ...prev])
        showToast('Shop created.')
      }
      setShopFormOpen(false); setEditingShop(null)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setShopBusy(false) }
  }
  async function handleDeleteShop(id: string) {
    if (!window.confirm('Delete this shop and all its products?')) return
    try {
      await adminDeleteShop(id)
      setShops(prev => prev.filter(s => s.id !== id))
      showToast('Shop deleted.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
  }
  function openAddProduct(shopId: string) {
    setProductForm({ name: '', description: '', category: 'SEEDS', price: '', unit: '', quantity: '' })
    setEditingProduct(null)
    setProductFormShopId(shopId)
  }
  function openEditProduct(shopId: string, p: SupplyProduct) {
    setProductForm({ name: p.name, description: p.description, category: p.category, price: String(p.price), unit: p.unit, quantity: String(p.quantity) })
    setEditingProduct({ shopId, product: p })
    setProductFormShopId(shopId)
  }
  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault()
    setShopBusy(true)
    try {
      if (editingProduct) {
        const updated = await adminUpdateProduct(editingProduct.shopId, editingProduct.product.id, productForm as Parameters<typeof adminUpdateProduct>[2])
        setShops(prev => prev.map(s => s.id === editingProduct.shopId ? { ...s, products: s.products.map(p => p.id === updated.id ? updated : p) } : s))
        showToast('Product updated.')
      } else if (productFormShopId) {
        const created = await adminAddProduct(productFormShopId, productForm as Parameters<typeof adminAddProduct>[1])
        setShops(prev => prev.map(s => s.id === productFormShopId ? { ...s, products: [created, ...s.products] } : s))
        showToast('Product added.')
      }
      setProductFormShopId(null); setEditingProduct(null)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setShopBusy(false) }
  }
  async function handleDeleteProduct(shopId: string, productId: string) {
    if (!window.confirm('Delete this product?')) return
    try {
      await adminDeleteProduct(shopId, productId)
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, products: s.products.filter(p => p.id !== productId) } : s))
      showToast('Product deleted.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
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
    { key: 'shops', label: 'Shops' },
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
        {/* Shops */}
        {!loading && tab === 'shops' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[#455A64]">{shops.length} shop{shops.length !== 1 ? 's' : ''}</p>
              <button onClick={openCreateShop}
                className="bg-[#4CAF50] hover:bg-[#2E7D32] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                + Add shop
              </button>
            </div>

            {shopFormOpen && (
              <div className="mb-6 bg-white rounded-xl border border-[#B0BEC5] p-5">
                <h3 className="font-semibold text-[#212121] mb-4">{editingShop ? 'Edit shop' : 'Create shop'}</h3>
                <form onSubmit={handleShopSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <AF label="Shop Name"><input className={ai()} value={shopForm.name} onChange={e => setShopForm(p => ({ ...p, name: e.target.value }))} required /></AF>
                    <AF label="Phone"><input className={ai()} value={shopForm.phone} onChange={e => setShopForm(p => ({ ...p, phone: e.target.value }))} required /></AF>
                  </div>
                  <AF label="Description"><textarea className={ai()} rows={2} value={shopForm.description} onChange={e => setShopForm(p => ({ ...p, description: e.target.value }))} required /></AF>
                  <AF label="Address"><input className={ai()} value={shopForm.address} onChange={e => setShopForm(p => ({ ...p, address: e.target.value }))} required /></AF>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <AF label="District"><input className={ai()} value={shopForm.district} onChange={e => setShopForm(p => ({ ...p, district: e.target.value }))} required /></AF>
                    <AF label="Sector"><input className={ai()} value={shopForm.sector} onChange={e => setShopForm(p => ({ ...p, sector: e.target.value }))} required /></AF>
                  </div>
                  {!editingShop && (
                    <AF label="Owner">
                      <select className={ai()} value={shopForm.ownerId} onChange={e => setShopForm(p => ({ ...p, ownerId: e.target.value }))} required>
                        <option value="">Select a user</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.role}</option>
                        ))}
                      </select>
                    </AF>
                  )}
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={shopBusy} className="bg-[#4CAF50] hover:bg-[#2E7D32] disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                      {shopBusy ? 'Saving…' : editingShop ? 'Save changes' : 'Create shop'}
                    </button>
                    <button type="button" onClick={() => { setShopFormOpen(false); setEditingShop(null) }}
                      className="px-4 py-2 rounded-lg border border-[#B0BEC5] text-[#455A64] text-sm hover:bg-[#F5F5F5] transition-colors">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {shops.length === 0 && <Empty title="No shops yet" sub="" />}
            <div className="space-y-4">
              {shops.map(shop => (
                <div key={shop.id} className="bg-white rounded-xl border border-[#B0BEC5] overflow-hidden">
                  <div className="p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#212121]">{shop.name}</h3>
                      <p className="text-xs text-[#455A64] mt-0.5">{shop.description}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-[#455A64]">
                        <span>📞 {shop.phone}</span>
                        <span>📍 {shop.address}, {shop.district}, {shop.sector}</span>
                        <span className="text-[#B0BEC5]">Owner: {shop.owner?.name}{shop.owner?.email ? ` (${shop.owner.email})` : ''}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setExpandedShop(expandedShop === shop.id ? null : shop.id)}
                        className="text-xs border border-[#455A64] text-[#455A64] px-3 py-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors">
                        {expandedShop === shop.id ? 'Hide' : `Products (${shop.products.length})`}
                      </button>
                      <button onClick={() => openEditShop(shop)}
                        className="text-xs border border-[#2E7D32] text-[#2E7D32] px-3 py-1.5 rounded-lg hover:bg-[#2E7D32]/10 transition-colors">Edit</button>
                      <button onClick={() => handleDeleteShop(shop.id)}
                        className="text-xs border border-[#E53935] text-[#E53935] px-3 py-1.5 rounded-lg hover:bg-[#E53935]/10 transition-colors">Delete</button>
                    </div>
                  </div>

                  {expandedShop === shop.id && (
                    <div className="border-t border-[#F5F5F5] px-4 pb-4">
                      <div className="flex items-center justify-between py-3">
                        <p className="text-sm font-medium text-[#212121]">Products</p>
                        <button onClick={() => openAddProduct(shop.id)}
                          className="text-xs bg-[#4CAF50] hover:bg-[#2E7D32] text-white px-3 py-1.5 rounded-lg transition-colors">+ Add product</button>
                      </div>

                      {(productFormShopId === shop.id) && (
                        <form onSubmit={handleProductSubmit} className="mb-4 p-3 rounded-lg border border-[#B0BEC5] space-y-3">
                          <p className="text-sm font-medium text-[#212121]">{editingProduct ? 'Edit product' : 'New product'}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <AF label="Name"><input className={ai()} value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} required /></AF>
                            <AF label="Category">
                              <select className={ai()} value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}>
                                {['SEEDS','FERTILIZERS','PESTICIDES','TOOLS','OTHER'].map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </AF>
                          </div>
                          <AF label="Description"><textarea className={ai()} rows={2} value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} required /></AF>
                          <div className="grid grid-cols-3 gap-3">
                            <AF label="Price (RWF)"><input type="number" min="1" className={ai()} value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} required /></AF>
                            <AF label="Unit"><input className={ai()} placeholder="kg, bag…" value={productForm.unit} onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))} required /></AF>
                            <AF label="Qty"><input type="number" min="0" className={ai()} value={productForm.quantity} onChange={e => setProductForm(p => ({ ...p, quantity: e.target.value }))} required /></AF>
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" disabled={shopBusy} className="bg-[#4CAF50] hover:bg-[#2E7D32] disabled:opacity-50 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors">
                              {shopBusy ? 'Saving…' : editingProduct ? 'Save' : 'Add'}
                            </button>
                            <button type="button" onClick={() => { setProductFormShopId(null); setEditingProduct(null) }}
                              className="px-3 py-1.5 rounded-lg border border-[#B0BEC5] text-[#455A64] text-xs hover:bg-[#F5F5F5] transition-colors">Cancel</button>
                          </div>
                        </form>
                      )}

                      {shop.products.length === 0 && <p className="text-sm text-[#B0BEC5]">No products yet.</p>}
                      <div className="space-y-2">
                        {shop.products.map(p => (
                          <div key={p.id} className="flex items-start justify-between gap-3 rounded-lg border border-[#B0BEC5] p-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-[#212121]">{p.name}</span>
                                <span className="text-xs bg-[#F5F5F5] text-[#455A64] px-2 py-0.5 rounded-full">{p.category}</span>
                              </div>
                              <p className="text-xs text-[#455A64] mt-0.5 line-clamp-1">{p.description}</p>
                              <p className="text-xs font-medium text-[#2E7D32] mt-0.5">RWF {Number(p.price).toLocaleString()} / {p.unit} · Qty: {p.quantity}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button onClick={() => openEditProduct(shop.id, p)}
                                className="text-xs border border-[#2E7D32] text-[#2E7D32] px-2 py-1 rounded-lg hover:bg-[#2E7D32]/10 transition-colors">Edit</button>
                              <button onClick={() => handleDeleteProduct(shop.id, p.id)}
                                className="text-xs border border-[#E53935] text-[#E53935] px-2 py-1 rounded-lg hover:bg-[#E53935]/10 transition-colors">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
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

function ai() {
  return 'w-full rounded-lg border border-[#B0BEC5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white'
}

function AF({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-[#455A64]">{label}</label>
      {children}
    </div>
  )
}
