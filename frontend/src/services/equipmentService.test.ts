import { vi } from 'vitest'
import { addEquipment, fetchAvailableEquipment, fetchMyEquipment } from './equipmentService'

vi.mock('../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { api } from '../api/axios'

const mockGet = api.get as ReturnType<typeof vi.fn>
const mockPost = api.post as ReturnType<typeof vi.fn>

describe('equipmentService', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
  })

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
    const payload = {
      name: 'Seeder', description: 'Two-row seed drill', category: 'Seeder',
      dailyPrice: '100', imageUrl: '', district: 'Gasabo', sector: 'Kimironko',
    }
    await expect(addEquipment(payload)).resolves.toEqual({ id: '3', name: 'Seeder', status: 'pending' })
    expect(mockPost).toHaveBeenCalledWith('/api/equipment', payload)
  })
})
