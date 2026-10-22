import type { AddEquipmentPayload, OwnerEquipment, PublicEquipment } from '../types/equipment'

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`)
  return json.data as T
}

export async function fetchAvailableEquipment(): Promise<PublicEquipment[]> {
  const res = await fetch('/api/equipment')
  return handleResponse<PublicEquipment[]>(res)
}

export async function fetchOwnerEquipment(ownerId: string): Promise<OwnerEquipment[]> {
  const res = await fetch(`/api/equipment/owner/${encodeURIComponent(ownerId)}`)
  return handleResponse<OwnerEquipment[]>(res)
}

export async function addEquipment(payload: AddEquipmentPayload): Promise<OwnerEquipment> {
  const res = await fetch('/api/equipment', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  return handleResponse<OwnerEquipment>(res)
}
