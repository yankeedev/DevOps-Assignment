import { api } from '../api/axios'
import type { ApprovalStatus, EquipmentStatus } from '../types/equipment'
import type { SupplyShop, SupplyProduct, ProductCategory } from './shopService'

export type { SupplyShop, SupplyProduct }

export interface AdminStats {
  totalUsers: number
  totalEquipment: number
  pendingEquipment: number
  approvedEquipment: number
  rejectedEquipment: number
  totalBookings: number
  pendingBookings: number
  approvedBookings: number
}

export interface AdminEquipment {
  id: string
  name: string
  description: string
  category: string
  dailyPrice: string
  imageUrl: string | null
  district: string
  sector: string
  status: EquipmentStatus
  approvalStatus: ApprovalStatus
  createdAt: string
  owner: { id: string; name: string; email: string }
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export interface AdminBooking {
  id: string
  startDate: string
  endDate: string
  totalCost: string
  status: string
  paymentStatus: string
  createdAt: string
  equipment: { id: string; name: string; category: string }
  farmer: { id: string; name: string; email: string }
  owner: { id: string; name: string; email: string }
}

// Keep PendingEquipment as alias for backward compat
export type PendingEquipment = AdminEquipment

export async function fetchStats(): Promise<AdminStats> {
  const { data } = await api.get<{ data: AdminStats }>('/api/admin/stats')
  return data.data
}

export async function fetchAllEquipment(status?: string): Promise<AdminEquipment[]> {
  const { data } = await api.get<{ data: AdminEquipment[] }>(
    status ? `/api/admin/equipment?status=${status}` : '/api/admin/equipment'
  )
  return data.data
}

export async function fetchPendingEquipment(): Promise<PendingEquipment[]> {
  const { data } = await api.get<{ data: PendingEquipment[] }>('/api/admin/equipment/pending')
  return data.data
}

export async function approveEquipment(id: string): Promise<void> {
  await api.patch(`/api/admin/equipment/${encodeURIComponent(id)}/approve`)
}

export async function rejectEquipment(id: string): Promise<void> {
  await api.patch(`/api/admin/equipment/${encodeURIComponent(id)}/reject`)
}

export async function fetchAllUsers(): Promise<AdminUser[]> {
  const { data } = await api.get<{ data: AdminUser[] }>('/api/admin/users')
  return data.data
}

export async function fetchAllBookings(): Promise<AdminBooking[]> {
  const { data } = await api.get<{ data: AdminBooking[] }>('/api/admin/bookings')
  return data.data
}

export async function adminFetchShops(): Promise<SupplyShop[]> {
  const { data } = await api.get<{ data: SupplyShop[] }>('/api/admin/shops')
  return data.data
}

export async function adminCreateShop(payload: { name: string; description: string; phone: string; address: string; district: string; sector: string; ownerId: string }): Promise<SupplyShop> {
  const { data } = await api.post<{ data: SupplyShop }>('/api/admin/shops', payload)
  return data.data
}

export async function adminUpdateShop(id: string, payload: Partial<{ name: string; description: string; phone: string; address: string; district: string; sector: string }>): Promise<SupplyShop> {
  const { data } = await api.patch<{ data: SupplyShop }>(`/api/admin/shops/${id}`, payload)
  return data.data
}

export async function adminDeleteShop(id: string): Promise<void> {
  await api.delete(`/api/admin/shops/${id}`)
}

export async function adminAddProduct(shopId: string, payload: { name: string; description: string; category: ProductCategory; price: string; unit: string; quantity: string }): Promise<SupplyProduct> {
  const { data } = await api.post<{ data: SupplyProduct }>(`/api/admin/shops/${shopId}/products`, payload)
  return data.data
}

export async function adminUpdateProduct(shopId: string, productId: string, payload: Partial<{ name: string; description: string; category: ProductCategory; price: string; unit: string; quantity: string }>): Promise<SupplyProduct> {
  const { data } = await api.patch<{ data: SupplyProduct }>(`/api/admin/shops/${shopId}/products/${productId}`, payload)
  return data.data
}

export async function adminDeleteProduct(shopId: string, productId: string): Promise<void> {
  await api.delete(`/api/admin/shops/${shopId}/products/${productId}`)
}
