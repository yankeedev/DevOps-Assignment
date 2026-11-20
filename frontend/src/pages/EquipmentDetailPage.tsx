import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getEquipmentById } from '../services/equipmentService'
import { createBooking } from '../services/bookingService'
import type { PublicEquipment } from '../types/equipment'
import SiteHeader from '../components/SiteHeader'

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [equipment, setEquipment] = useState<PublicEquipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!id) return
    getEquipmentById(id)
      .then(setEquipment)
      .catch(() => setError('Equipment not found or no longer available.'))
      .finally(() => setLoading(false))
  }, [id])

  const days = startDate && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
    : 0

  const totalCost = equipment && days > 0
    ? (Number(equipment.dailyPrice) * days).toLocaleString()
    : null

  async function handleBooking(e: React.FormEvent) {
    e.preventDefault()
    setBookingError(null)
    if (!user) { navigate('/login'); return }
    if (!startDate || !endDate) { setBookingError('Please select both dates.'); return }
    if (days <= 0) { setBookingError('End date must be after start date.'); return }

    setSubmitting(true)
    try {
      await createBooking({ equipmentId: id!, startDate, endDate })
      setBookingSuccess(`Rental request submitted for ${days} day${days > 1 ? 's' : ''}. Total: RWF ${totalCost}`)
      setStartDate('')
      setEndDate('')
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const isOwner = user && equipment?.owner?.id === user.id

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <SiteHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link to="/equipment" className="text-sm text-[#2E7D32] hover:underline mb-6 inline-block">
          ← Back to equipment
        </Link>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-4 border-[#2E7D32] border-t-transparent animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">{error}</div>
        )}

        {equipment && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left — details */}
            <div className="lg:col-span-2 space-y-6">
              {equipment.imageUrl ? (
                <img src={equipment.imageUrl} alt={equipment.name}
                  className="w-full h-64 object-cover rounded-xl border border-[#B0BEC5]" />
              ) : (
                <div className="w-full h-64 rounded-xl bg-[#F5F5F5] border border-[#B0BEC5] flex items-center justify-center text-[#B0BEC5]">
                  No image
                </div>
              )}

              <div className="bg-white rounded-xl border border-[#B0BEC5] p-6 space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#212121]">{equipment.name}</h1>
                  <p className="text-sm text-[#455A64] mt-1">{equipment.category} · {equipment.district}, {equipment.sector}</p>
                </div>
                <p className="text-[#455A64]">{equipment.description}</p>
                <div className="flex flex-wrap gap-4 pt-2 border-t border-[#F5F5F5]">
                  <div>
                    <p className="text-xs text-[#B0BEC5]">Daily price</p>
                    <p className="font-semibold text-[#2E7D32]">RWF {Number(equipment.dailyPrice).toLocaleString()} / day</p>
                  </div>
                  {equipment.owner && (
                    <div>
                      <p className="text-xs text-[#B0BEC5]">Listed by</p>
                      <p className="font-medium text-[#212121]">{equipment.owner.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[#B0BEC5]">Listed on</p>
                    <p className="font-medium text-[#212121]">{new Date(equipment.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — booking form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[#B0BEC5] p-6 sticky top-6">
                <h2 className="font-semibold text-[#212121] mb-4">Request to rent</h2>

                {isOwner && (
                  <p className="text-sm text-[#455A64] bg-[#F5F5F5] rounded-lg p-3">
                    This is your equipment listing.
                  </p>
                )}

                {!isOwner && (
                  <>
                    {bookingSuccess && (
                      <div className="mb-4 rounded-lg border border-[#43A047] bg-[#43A047]/10 px-3 py-2 text-sm text-[#1B5E20]">
                        ✓ {bookingSuccess}
                      </div>
                    )}
                    {bookingError && (
                      <div className="mb-4 rounded-lg border border-[#E53935] bg-[#E53935]/10 px-3 py-2 text-sm text-[#E53935]">
                        {bookingError}
                      </div>
                    )}

                    {!user ? (
                      <p className="text-sm text-[#455A64]">
                        <Link to="/login" className="text-[#2E7D32] font-medium hover:underline">Sign in</Link> to request a rental.
                      </p>
                    ) : (
                      <form onSubmit={handleBooking} className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-[#212121] block mb-1">Start date</label>
                          <input type="date" min={today} value={startDate}
                            onChange={e => { setStartDate(e.target.value); setBookingError(null); setBookingSuccess(null) }}
                            className="w-full rounded-lg border border-[#B0BEC5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                            required />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-[#212121] block mb-1">End date</label>
                          <input type="date" min={startDate || today} value={endDate}
                            onChange={e => { setEndDate(e.target.value); setBookingError(null); setBookingSuccess(null) }}
                            className="w-full rounded-lg border border-[#B0BEC5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                            required />
                        </div>

                        {days > 0 && (
                          <div className="rounded-lg bg-[#F5F5F5] px-3 py-2 text-sm">
                            <span className="text-[#455A64]">{days} day{days > 1 ? 's' : ''} × RWF {Number(equipment.dailyPrice).toLocaleString()}</span>
                            <p className="font-semibold text-[#2E7D32] mt-0.5">Total: RWF {totalCost}</p>
                          </div>
                        )}

                        <button type="submit" disabled={submitting}
                          className="w-full bg-[#4CAF50] hover:bg-[#2E7D32] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
                          {submitting ? 'Submitting…' : 'Submit rental request'}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
