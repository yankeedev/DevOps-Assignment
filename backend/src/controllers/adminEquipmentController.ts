import { Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

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