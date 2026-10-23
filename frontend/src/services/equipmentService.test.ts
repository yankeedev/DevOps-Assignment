import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}))

vi.mock('../api/axios', () => ({
  api: {
    get: mockGet,
    post: mockPost,
  },
}))

import { addEquipment, fetchAvailableEquipment, fetchMyEquipment } from './equipmentService'

beforeEach(() => {
  mockGet.mockReset()
  mockPost.mockReset()
})

describe('equipmentService', () => {
  it('fetches available equipment from the API', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: '1', name: 'Tractor' }] } })

    await expect(fetchAvailableEquipment()).resolves.toEqual([{ id: '1', name: 'Tractor' }])
    expect(mockGet).toHaveBeenCalledWith('/api/equipment')
  })

  it('fetches owned equipment from the API', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: '2', name: 'Harvester', status: 'approved' }] } })

    await expect(fetchMyEquipment()).resolves.toEqual([{ id: '2', name: 'Harvester', status: 'approved' }])
    expect(mockGet).toHaveBeenCalledWith('/api/equipment/mine')
  })

  it('adds equipment through the API', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { id: '3', name: 'Seeder', status: 'pending' } } })

    await expect(
      addEquipment({ name: 'Seeder', category: 'Planting', quantity: 2, pricePerDay: 100 }),
    ).resolves.toEqual({ id: '3', name: 'Seeder', status: 'pending' })

    expect(mockPost).toHaveBeenCalledWith('/api/equipment', {
      name: 'Seeder',
      category: 'Planting',
      quantity: 2,
      pricePerDay: 100,
    })
  })
})
