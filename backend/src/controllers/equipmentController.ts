import { Request, Response } from 'express'
import prisma from '../config/prisma'

// POST /api/equipment
// Creates a new equipment listing with approvalStatus=PENDING.
//
// NOTE: Authentication is not yet implemented. The request body must include
// an `ownerId` that references an existing User with role EQUIPMENT_OWNER.
// This is a temporary development-only approach. Once authentication is added,
// ownerId must be derived from the verified session token, never from the body.
export async function createEquipment(req: Request, res: Response): Promise<void> {
  const { name, description, category, dailyPrice, imageUrl, district, sector, ownerId } = req.body

  // --- Validation ---
  const missing: string[] = []
  if (!name?.trim())        missing.push('name')
  if (!description?.trim()) missing.push('description')
  if (!category?.trim())    missing.push('category')
  if (!district?.trim())    missing.push('district')
  if (!sector?.trim())      missing.push('sector')
  if (!ownerId?.trim())     missing.push('ownerId')

  if (missing.length > 0) {
    res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` })
    return
  }

  const price = parseFloat(dailyPrice)
  if (isNaN(price) || price <= 0) {
    res.status(400).json({ error: 'dailyPrice must be a positive number' })
    return
  }

  // Verify the owner exists and has the correct role
  const owner = await prisma.user.findUnique({ where: { id: ownerId } })
  if (!owner) {
    res.status(404).json({ error: 'Owner not found' })
    return
  }
  if (owner.role !== 'EQUIPMENT_OWNER') {
    res.status(403).json({ error: 'Only users with role EQUIPMENT_OWNER can add equipment' })
    return
  }

  const equipment = await prisma.equipment.create({
    data: {
      name:           name.trim(),
      description:    description.trim(),
      category:       category.trim(),
      dailyPrice:     price,
      imageUrl:       imageUrl?.trim() || null,
      district:       district.trim(),
      sector:         sector.trim(),
      ownerId,
      status:         'AVAILABLE',
      approvalStatus: 'PENDING',
    },
  })

  res.status(201).json({ data: equipment })
}

// GET /api/equipment
// Returns only tools that are APPROVED and AVAILABLE — filtered in the DB.
export async function listAvailableEquipment(_req: Request, res: Response): Promise<void> {
  const equipment = await prisma.equipment.findMany({
    where: {
      approvalStatus: 'APPROVED',
      status:         'AVAILABLE',
    },
    select: {
      id:          true,
      name:        true,
      description: true,
      category:    true,
      dailyPrice:  true,
      imageUrl:    true,
      district:    true,
      sector:      true,
      createdAt:   true,
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ data: equipment })
}

// GET /api/equipment/owner/:ownerId
// Returns all equipment for a specific owner, including pending ones.
// Used by the owner dashboard.
// NOTE: In production this must be protected by authentication middleware.
export async function listOwnerEquipment(req: Request, res: Response): Promise<void> {
  const { ownerId } = req.params

  if (!ownerId?.trim()) {
    res.status(400).json({ error: 'ownerId is required' })
    return
  }

  const owner = await prisma.user.findUnique({ where: { id: ownerId } })
  if (!owner) {
    res.status(404).json({ error: 'Owner not found' })
    return
  }

  const equipment = await prisma.equipment.findMany({
    where: { ownerId },
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
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ data: equipment })
}
