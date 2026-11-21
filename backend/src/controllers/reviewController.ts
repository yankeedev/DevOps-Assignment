import { Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

// GET /api/equipment/:id/reviews
export async function listReviews(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const reviews = await prisma.review.findMany({
      where: { equipmentId: id, status: "PUBLISHED" },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const avg = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;
    res.json({ data: reviews, averageRating: avg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/equipment/:id/reviews
export async function createOrUpdateReview(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id: equipmentId } = req.params;
    const userId = req.user!.userId;
    const { rating, comment } = req.body;

    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
      return;
    }

    const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!equipment || equipment.approvalStatus !== "APPROVED") {
      res.status(404).json({ error: "Equipment not found" });
      return;
    }
    if (equipment.ownerId === userId) {
      res.status(400).json({ error: "You cannot review your own equipment" });
      return;
    }

    // Only users who completed a booking can review
    const completed = await prisma.booking.findFirst({
      where: { equipmentId, farmerId: userId, status: { in: ["APPROVED", "ACTIVE", "COMPLETED"] } },
    });
    if (!completed) {
      res.status(403).json({ error: "You can only review equipment you have rented" });
      return;
    }

    const review = await prisma.review.upsert({
      where: { userId_equipmentId: { userId, equipmentId } },
      create: { userId, equipmentId, rating: r, comment: comment?.trim() || null, status: "PUBLISHED" },
      update: { rating: r, comment: comment?.trim() || null, status: "PUBLISHED" },
      include: { user: { select: { id: true, name: true } } },
    });

    res.status(201).json({ data: review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// DELETE /api/equipment/:id/reviews — delete own review
export async function deleteReview(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id: equipmentId } = req.params;
    const userId = req.user!.userId;
    const existing = await prisma.review.findUnique({
      where: { userId_equipmentId: { userId, equipmentId } },
    });
    if (!existing) { res.status(404).json({ error: "Review not found" }); return; }
    await prisma.review.delete({ where: { userId_equipmentId: { userId, equipmentId } } });
    res.json({ message: "Review deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
