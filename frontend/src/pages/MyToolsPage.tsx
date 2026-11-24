import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchMyEquipment, updateEquipment, deleteEquipment } from '../services/equipmentService'
import {
  fetchMyBookings, fetchIncomingBookings,
  approveBooking, rejectBooking, cancelBooking,
  type Booking,
} from '../services/bookingService'
import {
  fetchMyShop, createShop, updateShop, addProduct, updateProduct, deleteProduct,
  type SupplyShop, type SupplyProduct,
} from '../services/shopService'
import type { OwnerEquipment } from '../types/equipment'
import AddEquipmentForm from '../components/AddEquipmentForm'
import SiteHeader from '../components/SiteHeader'

type Tab = 'tools' | 'my-rentals' | 'incoming' | 'shop'

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  APPROVED:  'bg-green-100 text-green-800',
  REJECTED:  'bg-red-100 text-red-800',
  ACTIVE:    'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

const CATEGORIES = ['Tractor', 'Harvester', 'Plough', 'Irrigation', 'Sprayer', 'Seeder', 'Other']
const DISTRICTS = [
  'Bugesera','Burera','Gakenke','Gasabo','Gatsibo','Gicumbi','Gisagara','Huye','Kamonyi',
  'Karongi','Kayonza','Kicukiro','Kirehe','Muhanga','Musanze','Ngoma','Ngororero','Nyabihu',
  'Nyagatare','Nyamagabe','Nyamasheke','Nyanza','Nyarugenge','Nyaruguru','Rubavu','Ruhango',
  'Rulindo','Rusizi','Rutsiro','Rwamagana',
]

export default function MyToolsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('tools')

  // tools state
  const [equipment, setEquipment] = useState<OwnerEquipment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<OwnerEquipment | null>(null)
  const [editForm, setEditForm] = useState<Partial<OwnerEquipment>>({})
  const [editBusy, setEditBusy] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // bookings state
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [incoming, setIncoming] = useState<Booking[]>([])
  const [actionBusy, setActionBusy] = useState<string | null>(null)

  // shop state
  const [shop, setShop] = useState<SupplyShop | null | undefined>(undefined)
  const [shopForm, setShopForm] = useState({ name: '', description: '', phone: '', address: '', district: '', sector: '' })
  const [editingShop, setEditingShop] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [productForm, setProductForm] = useState({ name: '', description: '', category: 'SEEDS', price: '', unit: '', quantity: '' })
  const [editingProduct, setEditingProduct] = useState<SupplyProduct | null>(null)
  const [shopBusy, setShopBusy] = useState(false)

  // shared
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const load = async () => {
      if (tab === 'tools') await fetchMyEquipment().then(setEquipment)
      else if (tab === 'my-rentals') await fetchMyBookings().then(setMyBookings)
      else if (tab === 'incoming') await fetchIncomingBookings().then(setIncoming)
      else if (tab === 'shop') await fetchMyShop().then(s => { setShop(s); if (s) setShopForm({ name: s.name, description: s.description, phone: s.phone, address: s.address, district: s.district, sector: s.sector }) })
    }
    load().catch(() => setError('Failed to load data')).finally(() => setLoading(false))
  }, [tab])

  function flash(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 5000)
  }

  // ── Tools handlers ──────────────────────────────────────────────────────────
  function handleAdded(created: OwnerEquipment) {
    setEquipment(prev => [created, ...prev])
    setShowForm(false)
    flash(`"${created.name}" submitted — awaiting admin approval.`)
  }

  function startEdit(item: OwnerEquipment) {
    setEditingItem(item)
    setEditForm({
      name: item.name, description: item.description, category: item.category,
      dailyPrice: item.dailyPrice, imageUrl: item.imageUrl ?? '', district: item.district, sector: item.sector,
    })
  }

  async function handleEditSave() {
    if (!editingItem) return
    setEditBusy(true)
    try {
      const updated = await updateEquipment(editingItem.id, { ...editForm, imageUrl: editForm.imageUrl ?? undefined })
      setEquipment(prev => prev.map(e => e.id === updated.id ? updated : e))
      setEditingItem(null)
      flash('Tool updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally { setEditBusy(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await deleteEquipment(id)
      setEquipment(prev => prev.filter(e => e.id !== id))
      flash(`"${name}" deleted.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally { setDeletingId(null) }
  }

  // ── Booking handlers ────────────────────────────────────────────────────────
  async function handleCancel(id: string) {
    setActionBusy(id)
    try {
      await cancelBooking(id)
      setMyBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel')
    } finally { setActionBusy(null) }
  }

  async function handleIncoming(id: string, action: 'approve' | 'reject') {
    setActionBusy(id + action)
    try {
      if (action === 'approve') {
        await approveBooking(id)
        // approving one auto-rejects all other pending bookings for the same equipment
        setIncoming(prev => {
          const approved = prev.find(b => b.id === id)
          return prev.map(b => {
            if (b.id === id) return { ...b, status: 'APPROVED' as const }
            if (approved && b.equipmentId === approved.equipmentId && b.status === 'PENDING')
              return { ...b, status: 'REJECTED' as const }
            return b
          })
        })
      } else {
        await rejectBooking(id)
        setIncoming(prev => prev.map(b => b.id === id ? { ...b, status: 'REJECTED' as const } : b))
      }
      flash(`Booking ${action === 'approve' ? 'approved' : 'rejected'}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally { setActionBusy(null) }
  }

  // ── Shop handlers ────────────────────────────────────────────────────────
  async function handleCreateShop(e: React.FormEvent) {
    e.preventDefault()
    setShopBusy(true)
    try {
      const created = await createShop(shopForm)
      setShop(created)
      flash('Shop created!')
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create shop') }
    finally { setShopBusy(false) }
  }

  async function handleUpdateShop(e: React.FormEvent) {
    e.preventDefault()
    if (!shop) return
    setShopBusy(true)
    try {
      const updated = await updateShop(shop.id, shopForm)
      setShop(updated)
      setEditingShop(false)
      flash('Shop updated!')
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update shop') }
    finally { setShopBusy(false) }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!shop) return
    setShopBusy(true)
    try {
      const p = await addProduct(shop.id, { ...productForm, category: productForm.category as import('../services/shopService').ProductCategory, price: productForm.price, quantity: Number(productForm.quantity) })
      setShop(prev => prev ? { ...prev, products: [p, ...prev.products] } : prev)
      setShowProductForm(false)
      setProductForm({ name: '', description: '', category: 'SEEDS', price: '', unit: '', quantity: '' })
      flash('Product added!')
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to add product') }
    finally { setShopBusy(false) }
  }

  async function handleUpdateProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!shop || !editingProduct) return
    setShopBusy(true)
    try {
      const updated = await updateProduct(shop.id, editingProduct.id, { ...productForm, category: productForm.category as import('../services/shopService').ProductCategory, price: productForm.price, quantity: Number(productForm.quantity) })
      setShop(prev => prev ? { ...prev, products: prev.products.map(p => p.id === updated.id ? updated : p) } : prev)
      setEditingProduct(null)
      flash('Product updated!')
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update product') }
    finally { setShopBusy(false) }
  }

  async function handleDeleteProduct(productId: string) {
    if (!shop || !window.confirm('Delete this product?')) return
    try {
      await deleteProduct(shop.id, productId)
      setShop(prev => prev ? { ...prev, products: prev.products.filter(p => p.id !== productId) } : prev)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete product') }
  }

  function startEditProduct(p: SupplyProduct) {
    setEditingProduct(p)
    setProductForm({ name: p.name, description: p.description, category: p.category, price: String(p.price), unit: p.unit, quantity: String(p.quantity) })
    setShowProductForm(false)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'tools', label: 'My Tools' },
    { key: 'my-rentals', label: 'My Rentals' },
    { key: 'incoming', label: 'Incoming Requests' },
    { key: 'shop', label: 'My Shop' },
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <SiteHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#212121]">Dashboard</h2>
            <p className="text-sm text-[#455A64] mt-1">{user?.name}</p>
          </div>
          {tab === 'tools' && !showForm && !editingItem && (
            <button onClick={() => { setShowForm(true); setSuccessMsg(null) }}
              className="bg-[#4CAF50] hover:bg-[#2E7D32] text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors">
              + Add tool
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-[#B0BEC5] p-1 w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setError(null); setEditingItem(null) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-[#2E7D32] text-white' : 'text-[#455A64] hover:bg-[#F5F5F5]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {successMsg && (
          <div className="mb-5 rounded-lg border border-[#43A047] bg-[#43A047]/10 px-4 py-3 text-sm text-[#1B5E20]">✓ {successMsg}</div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-[#E53935] bg-[#E53935]/10 px-4 py-3 text-sm text-[#E53935]">{error}</div>
        )}

        {loading && <Spinner />}

        {/* ── MY TOOLS TAB ─────────────────────────────────────────────────── */}
        {!loading && tab === 'tools' && (
          <>
            {showForm && (
              <div className="mb-8 bg-white rounded-xl border border-[#B0BEC5] shadow-sm p-6">
                <h3 className="text-lg font-semibold text-[#212121] mb-4">Add new tool</h3>
                <AddEquipmentForm onSuccess={handleAdded} onCancel={() => setShowForm(false)} />
              </div>
            )}

            {editingItem && (
              <div className="mb-8 bg-white rounded-xl border border-[#B0BEC5] shadow-sm p-6">
                <h3 className="text-lg font-semibold text-[#212121] mb-4">Edit: {editingItem.name}</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EField label="Tool Name">
                      <input className={inp()} value={editForm.name ?? ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                    </EField>
                    <EField label="Category">
                      <select className={inp()} value={editForm.category ?? ''} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}>
                        <option value="">Select</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </EField>
                  </div>
                  <EField label="Description">
                    <textarea className={inp()} rows={3} value={editForm.description ?? ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                  </EField>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EField label="Daily Price (RWF)">
                      <input type="number" className={inp()} value={editForm.dailyPrice ?? ''} onChange={e => setEditForm(p => ({ ...p, dailyPrice: e.target.value }))} />
                    </EField>
                    <EField label="District">
                      <select className={inp()} value={editForm.district ?? ''} onChange={e => setEditForm(p => ({ ...p, district: e.target.value }))}>
                        <option value="">Select</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </EField>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EField label="Sector">
                      <input className={inp()} value={editForm.sector ?? ''} onChange={e => setEditForm(p => ({ ...p, sector: e.target.value }))} />
                    </EField>
                    <EField label="Image URL (optional)">
                      <input className={inp()} value={editForm.imageUrl ?? ''} onChange={e => setEditForm(p => ({ ...p, imageUrl: e.target.value }))} />
                    </EField>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleEditSave} disabled={editBusy}
                      className="bg-[#4CAF50] hover:bg-[#2E7D32] disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
                      {editBusy ? 'Saving…' : 'Save changes'}
                    </button>
                    <button onClick={() => setEditingItem(null)} disabled={editBusy}
                      className="px-4 py-2 rounded-lg border border-[#B0BEC5] text-[#455A64] hover:bg-[#F5F5F5] text-sm transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {equipment.length === 0 && !showForm && !editingItem && (
              <Empty title="No tools listed yet" sub='Click "+ Add tool" to submit your first listing.' />
            )}

            {equipment.length > 0 && !editingItem && (
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
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[item.approvalStatus] ?? ''}`}>
                          {item.approvalStatus}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#2E7D32] mt-1">RWF {Number(item.dailyPrice).toLocaleString()} / day</p>
                      <p className="text-xs text-[#B0BEC5] mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
                      <button onClick={() => startEdit(item)}
                        className="text-xs border border-[#2E7D32] text-[#2E7D32] px-3 py-1.5 rounded-lg hover:bg-[#2E7D32]/10 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(item.id, item.name)} disabled={deletingId === item.id}
                        className="text-xs border border-[#E53935] text-[#E53935] px-3 py-1.5 rounded-lg hover:bg-[#E53935]/10 disabled:opacity-50 transition-colors">
                        {deletingId === item.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MY RENTALS TAB ───────────────────────────────────────────────── */}
        {!loading && tab === 'my-rentals' && (
          <>
            {myBookings.length === 0 && (
              <Empty title="No rental requests yet" sub="Browse equipment and submit a rental request." />
            )}
            <div className="space-y-4">
              {myBookings.map(b => (
                <div key={b.id} className="bg-white rounded-xl border border-[#B0BEC5] p-5">
                  <div className="flex gap-4">
                    {b.equipment?.imageUrl ? (
                      <img src={b.equipment.imageUrl} alt={b.equipment.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-xs text-[#B0BEC5] flex-shrink-0">No img</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-[#212121]">{b.equipment?.name}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[b.status] ?? ''}`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#455A64]">{b.equipment?.category} · {b.equipment?.district}, {b.equipment?.sector}</p>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {b.equipment?.dailyPrice && <Detail label="Daily price" value={`RWF ${Number(b.equipment.dailyPrice).toLocaleString()} / day`} />}
                        <Detail label="Start" value={new Date(b.startDate).toLocaleDateString()} />
                        <Detail label="End" value={new Date(b.endDate).toLocaleDateString()} />
                        <Detail label="Total cost" value={`RWF ${Number(b.totalCost).toLocaleString()}`} />
                        <Detail label="Payment" value={b.paymentStatus} />
                        <Detail label="Booked on" value={new Date(b.createdAt).toLocaleDateString()} />
                      </div>
                    </div>
                  </div>
                  {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                    <div className="mt-4 pt-4 border-t border-[#F5F5F5] flex justify-end">
                      <button onClick={() => handleCancel(b.id)} disabled={actionBusy === b.id}
                        className="text-xs text-[#E53935] border border-[#E53935] px-4 py-1.5 rounded-lg hover:bg-[#E53935]/10 disabled:opacity-50 transition-colors">
                        {actionBusy === b.id ? '…' : 'Cancel request'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── INCOMING REQUESTS TAB ────────────────────────────────────────── */}
        {!loading && tab === 'incoming' && (
          <>
            {incoming.length === 0 && (
              <Empty title="No incoming requests" sub="Rental requests for your tools will appear here." />
            )}
            <div className="space-y-4">
              {incoming.map(b => (
                <div key={b.id} className="bg-white rounded-xl border border-[#B0BEC5] p-5">
                  <div className="flex gap-4">
                    {b.equipment?.imageUrl ? (
                      <img src={b.equipment.imageUrl} alt={b.equipment.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-xs text-[#B0BEC5] flex-shrink-0">No img</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-[#212121]">{b.equipment?.name}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[b.status] ?? ''}`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#455A64]">{b.equipment?.category} · {b.equipment?.district}, {b.equipment?.sector}</p>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <Detail label="Farmer" value={b.farmer?.name ?? '—'} />
                        <Detail label="Email" value={b.farmer?.email ?? '—'} />
                        <Detail label="Start" value={new Date(b.startDate).toLocaleDateString()} />
                        <Detail label="End" value={new Date(b.endDate).toLocaleDateString()} />
                        <Detail label="Total cost" value={`RWF ${Number(b.totalCost).toLocaleString()}`} />
                        <Detail label="Payment" value={b.paymentStatus} />
                        <Detail label="Requested on" value={new Date(b.createdAt).toLocaleDateString()} />
                      </div>
                    </div>
                  </div>
                  {b.status === 'PENDING' && (
                    <div className="mt-4 pt-4 border-t border-[#F5F5F5] flex gap-3 justify-end">
                      <button onClick={() => handleIncoming(b.id, 'approve')} disabled={actionBusy !== null}
                        className="bg-[#4CAF50] hover:bg-[#2E7D32] disabled:opacity-50 text-white text-xs font-medium px-5 py-2 rounded-lg transition-colors">
                        {actionBusy === b.id + 'approve' ? '…' : 'Approve'}
                      </button>
                      <button onClick={() => handleIncoming(b.id, 'reject')} disabled={actionBusy !== null}
                        className="bg-[#E53935] hover:bg-[#E53935]/80 disabled:opacity-50 text-white text-xs font-medium px-5 py-2 rounded-lg transition-colors">
                        {actionBusy === b.id + 'reject' ? '…' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {/* ── MY SHOP TAB ─────────────────────────────────────────────────── */}
        {!loading && tab === 'shop' && (
          <ShopTab
            shop={shop}
            shopForm={shopForm} setShopForm={setShopForm}
            editingShop={editingShop} setEditingShop={setEditingShop}
            showProductForm={showProductForm} setShowProductForm={setShowProductForm}
            productForm={productForm} setProductForm={setProductForm}
            editingProduct={editingProduct} setEditingProduct={setEditingProduct}
            shopBusy={shopBusy}
            onCreateShop={handleCreateShop}
            onUpdateShop={handleUpdateShop}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onStartEditProduct={startEditProduct}
          />
        )}
      </main>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-[#B0BEC5]">{label}: </span>
      <span className="text-xs font-medium text-[#212121]">{value}</span>
    </div>
  )
}

function inp() {
  return 'w-full rounded-lg border border-[#B0BEC5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white'
}

function EField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-[#455A64]">{label}</label>
      {children}
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

const PRODUCT_CATEGORIES = ['SEEDS', 'FERTILIZERS', 'PESTICIDES', 'TOOLS', 'OTHER']
const CATEGORY_LABELS: Record<string, string> = {
  SEEDS: 'Seeds', FERTILIZERS: 'Fertilizers', PESTICIDES: 'Pesticides', TOOLS: 'Tools', OTHER: 'Other',
}
const SHOP_DISTRICTS = [
  'Bugesera','Burera','Gakenke','Gasabo','Gatsibo','Gicumbi','Gisagara','Huye','Kamonyi',
  'Karongi','Kayonza','Kicukiro','Kirehe','Muhanga','Musanze','Ngoma','Ngororero','Nyabihu',
  'Nyagatare','Nyamagabe','Nyamasheke','Nyanza','Nyarugenge','Nyaruguru','Rubavu','Ruhango',
  'Rulindo','Rusizi','Rutsiro','Rwamagana',
]

type ShopForm = { name: string; description: string; phone: string; address: string; district: string; sector: string }
type ProductForm = { name: string; description: string; category: string; price: string; unit: string; quantity: string }

function ShopTab({
  shop, shopForm, setShopForm, editingShop, setEditingShop,
  showProductForm, setShowProductForm, productForm, setProductForm,
  editingProduct, setEditingProduct, shopBusy,
  onCreateShop, onUpdateShop, onAddProduct, onUpdateProduct, onDeleteProduct, onStartEditProduct,
}: {
  shop: SupplyShop | null | undefined
  shopForm: ShopForm; setShopForm: React.Dispatch<React.SetStateAction<ShopForm>>
  editingShop: boolean; setEditingShop: (v: boolean) => void
  showProductForm: boolean; setShowProductForm: (v: boolean) => void
  productForm: ProductForm; setProductForm: React.Dispatch<React.SetStateAction<ProductForm>>
  editingProduct: SupplyProduct | null; setEditingProduct: (v: SupplyProduct | null) => void
  shopBusy: boolean
  onCreateShop: (e: React.FormEvent) => void
  onUpdateShop: (e: React.FormEvent) => void
  onAddProduct: (e: React.FormEvent) => void
  onUpdateProduct: (e: React.FormEvent) => void
  onDeleteProduct: (id: string) => void
  onStartEditProduct: (p: SupplyProduct) => void
}) {
  // No shop yet
  if (shop === undefined) return <Spinner />

  if (shop === null) {
    return (
      <div className="bg-white rounded-xl border border-[#B0BEC5] p-6">
        <h3 className="text-lg font-semibold text-[#212121] mb-4">Create your supply shop</h3>
        <form onSubmit={onCreateShop} className="space-y-4">
          <ShopFields form={shopForm} setForm={setShopForm} />
          <button type="submit" disabled={shopBusy}
            className="bg-[#4CAF50] hover:bg-[#2E7D32] disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
            {shopBusy ? 'Creating…' : 'Create shop'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Shop info */}
      <div className="bg-white rounded-xl border border-[#B0BEC5] p-5">
        {editingShop ? (
          <form onSubmit={onUpdateShop} className="space-y-4">
            <h3 className="text-base font-semibold text-[#212121]">Edit shop details</h3>
            <ShopFields form={shopForm} setForm={setShopForm} />
            <div className="flex gap-3">
              <button type="submit" disabled={shopBusy}
                className="bg-[#4CAF50] hover:bg-[#2E7D32] disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                {shopBusy ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditingShop(false)}
                className="px-4 py-2 rounded-lg border border-[#B0BEC5] text-[#455A64] text-sm hover:bg-[#F5F5F5] transition-colors">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-[#212121] text-lg">{shop.name}</h3>
              <p className="text-sm text-[#455A64] mt-0.5">{shop.description}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-[#455A64]">
                <span>📞 {shop.phone}</span>
                <span>📍 {shop.address}</span>
                <span>🗺 {shop.district}, {shop.sector}</span>
              </div>
            </div>
            <button onClick={() => setEditingShop(true)}
              className="text-xs border border-[#2E7D32] text-[#2E7D32] px-3 py-1.5 rounded-lg hover:bg-[#2E7D32]/10 transition-colors flex-shrink-0">
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Products */}
      <div className="bg-white rounded-xl border border-[#B0BEC5] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#212121]">Products ({shop.products.length})</h3>
          {!showProductForm && !editingProduct && (
            <button onClick={() => setShowProductForm(true)}
              className="bg-[#4CAF50] hover:bg-[#2E7D32] text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              + Add product
            </button>
          )}
        </div>

        {(showProductForm || editingProduct) && (
          <form onSubmit={editingProduct ? onUpdateProduct : onAddProduct} className="mb-5 pb-5 border-b border-[#F5F5F5] space-y-3">
            <h4 className="text-sm font-medium text-[#212121]">{editingProduct ? 'Edit product' : 'New product'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <EField label="Name"><input className={inp()} value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} required /></EField>
              <EField label="Category">
                <select className={inp()} value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}>
                  {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </EField>
            </div>
            <EField label="Description"><textarea className={inp()} rows={2} value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} required /></EField>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <EField label="Price (RWF)"><input type="number" min="1" className={inp()} value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} required /></EField>
              <EField label="Unit"><input className={inp()} placeholder="kg, bag, litre…" value={productForm.unit} onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))} required /></EField>
              <EField label="Quantity"><input type="number" min="0" className={inp()} value={productForm.quantity} onChange={e => setProductForm(p => ({ ...p, quantity: e.target.value }))} required /></EField>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={shopBusy}
                className="bg-[#4CAF50] hover:bg-[#2E7D32] disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                {shopBusy ? 'Saving…' : editingProduct ? 'Save changes' : 'Add product'}
              </button>
              <button type="button" onClick={() => { setShowProductForm(false); setEditingProduct(null) }}
                className="px-4 py-2 rounded-lg border border-[#B0BEC5] text-[#455A64] text-sm hover:bg-[#F5F5F5] transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {shop.products.length === 0 && !showProductForm && (
          <p className="text-sm text-[#B0BEC5]">No products yet. Add your first product.</p>
        )}
        <div className="space-y-2">
          {shop.products.map(p => (
            <div key={p.id} className="flex items-start justify-between gap-3 rounded-lg border border-[#B0BEC5] p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-[#212121]">{p.name}</span>
                  <span className="text-xs bg-[#F5F5F5] text-[#455A64] px-2 py-0.5 rounded-full">{CATEGORY_LABELS[p.category] ?? p.category}</span>
                </div>
                <p className="text-xs text-[#455A64] mt-0.5 line-clamp-1">{p.description}</p>
                <p className="text-xs font-medium text-[#2E7D32] mt-0.5">RWF {Number(p.price).toLocaleString()} / {p.unit} · Qty: {p.quantity}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => onStartEditProduct(p)}
                  className="text-xs border border-[#2E7D32] text-[#2E7D32] px-2 py-1 rounded-lg hover:bg-[#2E7D32]/10 transition-colors">Edit</button>
                <button onClick={() => onDeleteProduct(p.id)}
                  className="text-xs border border-[#E53935] text-[#E53935] px-2 py-1 rounded-lg hover:bg-[#E53935]/10 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ShopFields({ form, setForm }: { form: ShopForm; setForm: React.Dispatch<React.SetStateAction<ShopForm>> }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <EField label="Shop Name"><input className={inp()} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></EField>
        <EField label="Phone"><input className={inp()} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required /></EField>
      </div>
      <EField label="Description"><textarea className={inp()} rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required /></EField>
      <EField label="Address"><input className={inp()} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required /></EField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <EField label="District">
          <select className={inp()} value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} required>
            <option value="">Select district</option>
            {SHOP_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </EField>
        <EField label="Sector"><input className={inp()} value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))} required /></EField>
      </div>
    </>
  )
}
