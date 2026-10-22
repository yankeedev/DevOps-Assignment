import { api } from '../api/axios'
import type { AddEquipmentPayload, OwnerEquipment, PublicEquipment } from '../types/equipment'

export async function fetchAvailableEquipment(): Promise<PublicEquipment[]> {
  const { data } = await api.get<{ data: PublicEquipment[] }>('/api/equipment')
  return data.data
}

export async function fetchMyEquipment(): Promise<OwnerEquipment[]> {
  const { data } = await api.get<{ data: OwnerEquipment[] }>('/api/equipment/mine')
  return data.data
}

export async function addEquipment(payload: AddEquipmentPayload): Promise<OwnerEquipment> {
  const { data } = await api.post<{ data: OwnerEquipment }>('/api/equipment', payload)
  return data.data
}
