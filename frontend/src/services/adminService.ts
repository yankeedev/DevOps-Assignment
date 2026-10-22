import type { ApprovalStatus, EquipmentStatus } from '../types/equipment'

export interface PendingEquipment {
  id:             string
  name:           string
  description:    string
  category:       string
  dailyPrice:     string
  imageUrl:       string | null
  district:       string
  sector:         string
  status:         EquipmentStatus
  approvalStatus: ApprovalStatus
  createdAt:      string
  owner:          { id: string; name: string; email: string }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`)
  return json.data as T
}

const ADMIN_ID = import.meta.env.VITE_DEV_ADMIN_ID as string | undefined

function adminHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(ADMIN_ID ? { 'x-admin-id': ADMIN_ID } : {}),
  }
}

export async function fetchPendingEquipment(): Promise<PendingEquipment[]> {
  const res = await fetch('/api/admin/equipment/pending', { headers: adminHeaders() })
  return handleResponse<PendingEquipment[]>(res)
}

export async function approveEquipment(id: string): Promise<void> {
  const res = await fetch(`/api/admin/equipment/${encodeURIComponent(id)}/approve`, {
    method:  'PATCH',
    headers: adminHeaders(),
  })
  await handleResponse(res)
}

export async function rejectEquipment(id: string): Promise<void> {
  const res = await fetch(`/api/admin/equipment/${encodeURIComponent(id)}/reject`, {
    method:  'PATCH',
    headers: adminHeaders(),
  })
  await handleResponse(res)
}
