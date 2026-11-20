import { Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

// POST /api/bookings — farmer submits a rental request
export async function createBooking(req: AuthRequest, res: Response): Promise<void> {
  try {
    const farmerId = req.user!.userId;
    const { equipmentId, startDate, endDate } = req.body;

    if (!equipmentId || !startDate || !endDate) {
      res.status(400).json({ error: "equipmentId, startDate, and endDate are required" });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }
    if (start < now) {
      res.status(400).json({ error: "Start date cannot be in the past" });
      return;
    }
    if (end <= start) {
      res.status(400).json({ error: "End date must be after start date" });
      return;
    }

    const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!equipment) { res.status(404).json({ error: "Equipment not found" }); return; }
    if (equipment.approvalStatus !== "APPROVED") {
      res.status(400).json({ error: "Equipment is not approved for rental" });
      return;
    }
    if (equipment.status !== "AVAILABLE") {
      res.status(400).json({ error: "Equipment is not available" });
      return;
    }
    if (equipment.ownerId === farmerId) {
      res.status(400).json({ error: "You cannot rent your own equipment" });
      return;
    }

    // Check for overlapping approved/active bookings
    const overlap = await prisma.booking.findFirst({
      where: {
        equipmentId,
        status: { in: ["APPROVED", "ACTIVE"] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });
    if (overlap) {
      res.status(409).json({ error: "Equipment is already booked for those dates" });
      return;
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalCost = Number(equipment.dailyPrice) * days;

    const booking = await prisma.booking.create({
      data: {
        equipmentId,
        farmerId,
        ownerId: equipment.ownerId,
        startDate: start,
        endDate: end,
        totalCost,
        status: "PENDING",
        paymentStatus: "UNPAID",
      },
      include: {
        equipment: { select: { id: true, name: true, category: true, district: true, sector: true, imageUrl: true } },
      },
    });

    res.status(201).json({ data: booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// GET /api/bookings/mine — farmer views their rental requests
export async function listMyBookings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const bookings = await prisma.booking.findMany({
      where: { farmerId: req.user!.userId },
      include: {
        equipment: { select: { id: true, name: true, category: true, district: true, sector: true, imageUrl: true, dailyPrice: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// GET /api/bookings/incoming — owner views requests for their equipment
export async function listIncomingBookings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const bookings = await prisma.booking.findMany({
      where: { ownerId: req.user!.userId },
      include: {
        equipment: { select: { id: true, name: true, category: true, district: true, sector: true, imageUrl: true, dailyPrice: true } },
        farmer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// PATCH /api/bookings/:id/approve — owner approves a booking
export async function approveBooking(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
    if (booking.ownerId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }
    if (booking.status !== "PENDING") {
      res.status(409).json({ error: `Cannot approve: status is ${booking.status}` });
      return;
    }

    // Re-check overlap inside transaction to prevent race conditions
    const [updated] = await prisma.$transaction(async (tx) => {
      const overlap = await tx.booking.findFirst({
        where: {
          equipmentId: booking.equipmentId,
          id: { not: id },
          status: { in: ["APPROVED", "ACTIVE"] },
          startDate: { lte: booking.endDate },
          endDate: { gte: booking.startDate },
        },
      });
      if (overlap) throw new Error("CONFLICT");

      const updatedBooking = await tx.booking.update({
        where: { id }, data: { status: "APPROVED" },
      });
      // Mark equipment UNAVAILABLE so no new bookings can be placed
      await tx.equipment.update({
        where: { id: booking.equipmentId }, data: { status: "UNAVAILABLE" },
      });
      // Reject all other PENDING bookings for the same equipment
      await tx.booking.updateMany({
        where: {
          equipmentId: booking.equipmentId,
          id: { not: id },
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      });
      return [updatedBooking];
    });

    res.json({ data: updated });
  } catch (err) {
    if (err instanceof Error && err.message === "CONFLICT") {
      res.status(409).json({ error: "Equipment is already booked for those dates" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// PATCH /api/bookings/:id/reject — owner rejects a booking
export async function rejectBooking(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
    if (booking.ownerId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }
    if (booking.status !== "PENDING") {
      res.status(409).json({ error: `Cannot reject: status is ${booking.status}` });
      return;
    }
    const updated = await prisma.booking.update({
      where: { id }, data: { status: "REJECTED" },
    });
    res.json({ data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// PATCH /api/bookings/:id/cancel — farmer cancels their own pending/approved booking
export async function cancelBooking(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
    if (booking.farmerId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }
    if (!(["PENDING", "APPROVED"] as string[]).includes(booking.status)) {
      res.status(409).json({ error: `Cannot cancel: status is ${booking.status}` });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id }, data: { status: "CANCELLED" } });
      // If this was an approved booking, free the equipment back to AVAILABLE
      if (booking.status === "APPROVED") {
        await tx.equipment.update({
          where: { id: booking.equipmentId }, data: { status: "AVAILABLE" },
        });
      }
    });

    res.json({ message: "Booking cancelled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
