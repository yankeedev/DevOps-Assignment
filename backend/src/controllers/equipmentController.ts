import { Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export async function createEquipment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, description, category, dailyPrice, imageUrl, district, sector } = req.body;

    const missing: string[] = [];
    if (!name?.trim()) missing.push("name");
    if (!description?.trim()) missing.push("description");
    if (!category?.trim()) missing.push("category");
    if (!district?.trim()) missing.push("district");
    if (!sector?.trim()) missing.push("sector");

    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
      return;
    }

    const price = parseFloat(dailyPrice);
    if (isNaN(price) || price <= 0) {
      res.status(400).json({ error: "dailyPrice must be a positive number" });
      return;
    }

    const equipment = await prisma.equipment.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        dailyPrice: price,
        imageUrl: imageUrl?.trim() || null,
        district: district.trim(),
        sector: sector.trim(),
        ownerId: req.user!.userId,
        status: "AVAILABLE",
        approvalStatus: "PENDING",
      },
    });

    res.status(201).json({ data: equipment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function listAvailableEquipment(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const equipment = await prisma.equipment.findMany({
      where: { approvalStatus: "APPROVED", status: "AVAILABLE" },
      select: {
        id: true, name: true, description: true, category: true,
        dailyPrice: true, imageUrl: true, district: true, sector: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: equipment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function listMyEquipment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const equipment = await prisma.equipment.findMany({
      where: { ownerId: req.user!.userId },
      select: {
        id: true, name: true, description: true, category: true,
        dailyPrice: true, imageUrl: true, district: true, sector: true,
        status: true, approvalStatus: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: equipment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}