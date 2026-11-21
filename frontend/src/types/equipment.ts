export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type EquipmentStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE'

export interface PublicEquipment {
  id:          string
  name:        string
  description: string
  category:    string
  dailyPrice:  string
  imageUrl:    string | null
  district:    string
  sector:      string
  status:      EquipmentStatus
  createdAt:   string
  owner?:      { id: string; name: string }
  bookings?:   { startDate: string; endDate: string }[]
}

export interface OwnerEquipment extends PublicEquipment {
  status:         EquipmentStatus
  approvalStatus: ApprovalStatus
}

export interface AddEquipmentPayload {
  name:        string
  description: string
  category:    string
  dailyPrice:  string
  imageUrl?:   string
  district:    string
  sector:      string
}
