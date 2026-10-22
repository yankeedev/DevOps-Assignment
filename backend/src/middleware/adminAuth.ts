import { Request, Response, NextFunction } from 'express'
import prisma from '../config/prisma'

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const adminId = req.headers['x-admin-id'] as string | undefined

  if (!adminId?.trim()) {
    res.status(401).json({ error: 'Unauthorized: missing x-admin-id header' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id: adminId } })

  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: admin access required' })
    return
  }

  next()
}
