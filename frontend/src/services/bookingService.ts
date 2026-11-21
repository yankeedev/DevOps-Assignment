import { api } from '../api/axios'

export interface Booking {
  id: string
  equipmentId: string
  farmerId: string
  ownerId: string
  startDate: string
  endDate: string
  totalCost: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED'
  createdAt: string
  equipment?: {
    id: string
    name: string
    category: string
    district: string
    sector: string
    imageUrl: string | null
    dailyPrice?: string
  }
  owner?: { id: string; name: string }
  farmer?: { id: string; name: string; email: string }
}

export interface CreateBookingPayload {
  equipmentId: string
  startDate: string
  endDate: string
}

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const { data } = await api.post<{ data: Booking }>('/api/bookings', payload)
  return data.data
}

export async function fetchMyBookings(): Promise<Booking[]> {
  const { data } = await api.get<{ data: Booking[] }>('/api/bookings/mine')
  return data.data
}

export async function fetchIncomingBookings(): Promise<Booking[]> {
  const { data } = await api.get<{ data: Booking[] }>('/api/bookings/incoming')
  return data.data
}

export async function approveBooking(id: string): Promise<void> {
  await api.patch(`/api/bookings/${encodeURIComponent(id)}/approve`)
}

export async function rejectBooking(id: string): Promise<void> {
  await api.patch(`/api/bookings/${encodeURIComponent(id)}/reject`)
}

export async function cancelBooking(id: string): Promise<void> {
  await api.patch(`/api/bookings/${encodeURIComponent(id)}/cancel`)
}
