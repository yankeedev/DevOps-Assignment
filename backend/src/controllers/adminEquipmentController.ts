import { Request, Response } from 'express'
import prisma from '../config/prisma'

// GET /api/admin/equipment/pending
export async function listPendingEquipment(_req: Request, res: Response): Promise<void> {
  const equipment = await prisma.equipment.findMany({
    where: { approvalStatus: 'PENDING' },
    select: {
      id:             true,
      name:           true,
      description:    true,
      category:       true,
      dailyPrice:     true,
      imageUrl:       true,
      district:       true,
      sector:         true,
      status:         true,
      approvalStatus: true,
      createdAt:      true,
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  res.json({ data: equipment })
}

// PATCH /api/admin/equipment/:id/approve
export async function approveEquipment(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const equipment = await prisma.equipment.findUnique({ where: { id } })

  if (!equipment) {
    res.status(404).json({ error: 'Equipment not found' })
    return
  }

  if (equipment.approvalStatus !== 'PENDING') {
    res.status(409).json({ error: `Cannot approve: current status is ${equipment.approvalStatus}` })
    return
  }

  const updated = await prisma.equipment.update({
    where: { id },
    data:  { approvalStatus: 'APPROVED' },
    select: { id: true, name: true, approvalStatus: true },
  })

  res.json({ data: updated })
}

// PATCH /api/admin/equipment/:id/reject
export async function rejectEquipment(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const equipment = await prisma.equipment.findUnique({ where: { id } })

  if (!equipment) {
    res.status(404).json({ error: 'Equipment not found' })
    return
  }

  if (equipment.approvalStatus !== 'PENDING') {
    res.status(409).json({ error: `Cannot reject: current status is ${equipment.approvalStatus}` })
    return
  }

  const updated = await prisma.equipment.update({
    where: { id },
    data:  { approvalStatus: 'REJECTED' },
    select: { id: true, name: true, approvalStatus: true },
  })

  res.json({ data: updated })
}
