export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type EquipmentStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE'

// Returned by GET /api/equipment (public — approved + available only)
export interface PublicEquipment {
  id:          string
  name:        string
  description: string
  category:    string
  dailyPrice:  string   // Prisma Decimal serialises as string
  imageUrl:    string | null
  district:    string
  sector:      string
  createdAt:   string
}

// Returned by GET /api/equipment/owner/:ownerId (owner dashboard)
export interface OwnerEquipment extends PublicEquipment {
  status:         EquipmentStatus
  approvalStatus: ApprovalStatus
}

export interface AddEquipmentPayload {
  name:        string
  description: string
  category:    string
  dailyPrice:  string
  imageUrl:    string
  district:    string
  sector:      string
  ownerId:     string
}
