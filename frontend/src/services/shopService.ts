import { api } from '../api/axios'

export type ProductCategory = 'SEEDS' | 'FERTILIZERS' | 'PESTICIDES' | 'TOOLS' | 'OTHER'

export interface SupplyProduct {
  id: string
  name: string
  description: string
  category: ProductCategory
  price: string
  unit: string
  quantity: number
  shopId: string
  approvalStatus: string
  createdAt: string
}

export interface SupplyShop {
  id: string
  name: string
  description: string
  phone: string
  address: string
  district: string
  sector: string
  ownerId: string
  createdAt: string
  owner?: { id: string; name: string; email?: string }
  products: SupplyProduct[]
}

export async function fetchShops(): Promise<SupplyShop[]> {
  const { data } = await api.get<{ data: SupplyShop[] }>('/api/shops')
  return data.data
}

export async function fetchMyShop(): Promise<SupplyShop | null> {
  const { data } = await api.get<{ data: SupplyShop | null }>('/api/shops/mine')
  return data.data
}

export async function createShop(payload: Omit<SupplyShop, 'id' | 'ownerId' | 'createdAt' | 'owner' | 'products'>): Promise<SupplyShop> {
  const { data } = await api.post<{ data: SupplyShop }>('/api/shops', payload)
  return data.data
}

export async function updateShop(id: string, payload: Partial<Omit<SupplyShop, 'id' | 'ownerId' | 'createdAt' | 'owner' | 'products'>>): Promise<SupplyShop> {
  const { data } = await api.patch<{ data: SupplyShop }>(`/api/shops/${id}`, payload)
  return data.data
}

export async function addProduct(shopId: string, payload: Omit<SupplyProduct, 'id' | 'shopId' | 'approvalStatus' | 'createdAt'>): Promise<SupplyProduct> {
  const { data } = await api.post<{ data: SupplyProduct }>(`/api/shops/${shopId}/products`, payload)
  return data.data
}

export async function updateProduct(shopId: string, productId: string, payload: Partial<Omit<SupplyProduct, 'id' | 'shopId' | 'approvalStatus' | 'createdAt'>>): Promise<SupplyProduct> {
  const { data } = await api.patch<{ data: SupplyProduct }>(`/api/shops/${shopId}/products/${productId}`, payload)
  return data.data
}

export async function deleteProduct(shopId: string, productId: string): Promise<void> {
  await api.delete(`/api/shops/${shopId}/products/${productId}`)
}
