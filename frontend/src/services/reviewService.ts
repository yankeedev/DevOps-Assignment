import { api } from '../api/axios'

export interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
  userId: string
  equipmentId: string
  user: { id: string; name: string }
}

export interface ReviewsResponse {
  data: Review[]
  averageRating: number | null
}

export async function fetchReviews(equipmentId: string): Promise<ReviewsResponse> {
  const { data } = await api.get<ReviewsResponse>(`/api/equipment/${equipmentId}/reviews`)
  return data
}

export async function submitReview(equipmentId: string, rating: number, comment: string): Promise<Review> {
  const { data } = await api.post<{ data: Review }>(`/api/equipment/${equipmentId}/reviews`, { rating, comment })
  return data.data
}

export async function removeReview(equipmentId: string): Promise<void> {
  await api.delete(`/api/equipment/${equipmentId}/reviews`)
}
