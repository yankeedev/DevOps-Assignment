import { Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

// GET /api/admin/stats
export async function getStats(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const [
      totalUsers, totalEquipment, pendingEquipment, approvedEquipment, rejectedEquipment,
      totalBookings, pendingBookings, approvedBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.equipment.count(),
      prisma.equipment.count({ where: { approvalStatus: "PENDING" } }),
      prisma.equipment.count({ where: { approvalStatus: "APPROVED" } }),
      prisma.equipment.count({ where: { approvalStatus: "REJECTED" } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: { in: ["APPROVED", "ACTIVE"] } } }),
    ]);

    res.json({
      data: {
        totalUsers, totalEquipment,
        pendingEquipment, approvedEquipment, rejectedEquipment,
        totalBookings, pendingBookings, approvedBookings,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// GET /api/admin/equipment?status=PENDING|APPROVED|REJECTED
export async function listAllEquipment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    const where = status ? { approvalStatus: status as "PENDING" | "APPROVED" | "REJECTED" } : {};
    const equipment = await prisma.equipment.findMany({
      where,
      select: {
        id: true, name: true, description: true, category: true,
        dailyPrice: true, imageUrl: true, district: true, sector: true,
        status: true, approvalStatus: true, createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: equipment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// GET /api/admin/equipment/pending (kept for backward compat)
export async function listPendingEquipment(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const equipment = await prisma.equipment.findMany({
      where: { approvalStatus: "PENDING" },
      select: {
        id: true, name: true, description: true, category: true,
        dailyPrice: true, imageUrl: true, district: true, sector: true,
        status: true, approvalStatus: true, createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({ data: equipment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// PATCH /api/admin/equipment/:id/approve
export async function approveEquipment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) { res.status(404).json({ error: "Equipment not found" }); return; }
    if (equipment.approvalStatus !== "PENDING") {
      res.status(409).json({ error: `Cannot approve: current status is ${equipment.approvalStatus}` });
      return;
    }
    const updated = await prisma.equipment.update({
      where: { id }, data: { approvalStatus: "APPROVED" },
      select: { id: true, name: true, approvalStatus: true },
    });
    res.json({ data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// PATCH /api/admin/equipment/:id/reject
export async function rejectEquipment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) { res.status(404).json({ error: "Equipment not found" }); return; }
    if (equipment.approvalStatus !== "PENDING") {
      res.status(409).json({ error: `Cannot reject: current status is ${equipment.approvalStatus}` });
      return;
    }
    const updated = await prisma.equipment.update({
      where: { id }, data: { approvalStatus: "REJECTED" },
      select: { id: true, name: true, approvalStatus: true },
    });
    res.json({ data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// GET /api/admin/users
export async function listAllUsers(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// GET /api/admin/bookings
export async function listAllBookings(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        equipment: { select: { id: true, name: true, category: true } },
        farmer: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
