import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ApprovalStatus, EquipmentStatus, OwnerEquipment, PublicEquipment } from '../types/equipment'

interface Props {
  equipment: PublicEquipment | OwnerEquipment
  showStatus?: boolean
}

const approvalBadge: Record<ApprovalStatus, string> = {
  PENDING:  'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100  text-green-800',
  REJECTED: 'bg-red-100    text-red-800',
}

const availabilityBadge: Record<EquipmentStatus, { label: string; cls: string } | null> = {
  AVAILABLE:   null,
  UNAVAILABLE: { label: 'Booked', cls: 'bg-orange-100 text-orange-800' },
  MAINTENANCE: { label: 'Maintenance', cls: 'bg-gray-100 text-gray-600' },
}

export default function EquipmentCard({ equipment, showStatus = false }: Props) {
  const { user } = useAuth()
  const owner = equipment as OwnerEquipment
  const isOwnTool = user && (equipment as PublicEquipment & { owner?: { id: string } }).owner?.id === user.id
  const isBooked = equipment.status === 'UNAVAILABLE'
  const booking = equipment.bookings?.[0]
  const availBadge = availabilityBadge[equipment.status]

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <Link to={showStatus || isBooked ? '#' : `/equipment/${equipment.id}`} className={showStatus || isBooked ? 'pointer-events-none relative' : 'relative'}>
        {equipment.imageUrl ? (
          <img src={equipment.imageUrl} alt={equipment.name} className={`h-44 w-full object-cover${isBooked ? ' opacity-60' : ''}`} />
        ) : (
          <div className="h-44 w-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
        {availBadge && (
          <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${availBadge.cls}`}>
            {availBadge.label}
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-base leading-tight">{equipment.name}</h3>
          {showStatus && owner.approvalStatus && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${approvalBadge[owner.approvalStatus]}`}>
              {owner.approvalStatus === 'PENDING' ? 'Pending Approval' : owner.approvalStatus}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{equipment.description}</p>

        <div className="mt-auto pt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
          <span className="font-medium text-green-700">
            RWF {Number(equipment.dailyPrice).toLocaleString()} / day
          </span>
          <span>{equipment.category}</span>
          <span>{equipment.district}, {equipment.sector}</span>
        </div>

        {!showStatus && isBooked && (
          <div className="mt-2 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-xs text-orange-700 text-center">
            🔒 Booked
            {booking && (
              <span className="block text-orange-600 mt-0.5">
                {new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {!showStatus && !isBooked && !isOwnTool && (
          <Link
            to={user ? `/equipment/${equipment.id}` : '/login'}
            className="mt-2 w-full text-center bg-[#4CAF50] hover:bg-[#2E7D32] text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Book now
          </Link>
        )}

        {!showStatus && !isBooked && isOwnTool && (
          <span className="mt-2 w-full text-center text-xs text-[#455A64] bg-[#F5F5F5] py-2 rounded-lg">
            Your listing
          </span>
        )}
      </div>
    </div>
  )
}
