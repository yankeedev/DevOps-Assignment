import type { ApprovalStatus, OwnerEquipment, PublicEquipment } from '../types/equipment'

interface Props {
  equipment: PublicEquipment | OwnerEquipment
  showStatus?: boolean
}

const approvalBadge: Record<ApprovalStatus, string> = {
  PENDING:  'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100  text-green-800',
  REJECTED: 'bg-red-100    text-red-800',
}

export default function EquipmentCard({ equipment, showStatus = false }: Props) {
  const owner = equipment as OwnerEquipment

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
      {equipment.imageUrl ? (
        <img
          src={equipment.imageUrl}
          alt={equipment.name}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="h-44 w-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          No image
        </div>
      )}

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
      </div>
    </div>
  )
}
