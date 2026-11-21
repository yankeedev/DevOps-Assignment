<<<<<<< HEAD
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
=======
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

// GET /api/admin/shops
export async function adminListShops(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const shops = await prisma.supplyShop.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        products: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: shops });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/admin/shops
export async function adminCreateShop(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, description, phone, address, district, sector, ownerId } = req.body;
    if (!name || !description || !phone || !address || !district || !sector || !ownerId) {
      res.status(400).json({ error: "All fields including ownerId are required" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const shop = await prisma.supplyShop.create({
      data: {
        name: name.trim(), description: description.trim(), phone: phone.trim(),
        address: address.trim(), district: district.trim(), sector: sector.trim(),
        ownerId,
      },
      include: { owner: { select: { id: true, name: true, email: true } }, products: true },
    });
    res.status(201).json({ data: shop });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// PATCH /api/admin/shops/:id
export async function adminUpdateShop(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const shop = await prisma.supplyShop.findUnique({ where: { id } });
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    const { name, description, phone, address, district, sector } = req.body;
    const updated = await prisma.supplyShop.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description ? { description: description.trim() } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(address ? { address: address.trim() } : {}),
        ...(district ? { district: district.trim() } : {}),
        ...(sector ? { sector: sector.trim() } : {}),
      },
      include: { owner: { select: { id: true, name: true, email: true } }, products: true },
    });
    res.json({ data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// DELETE /api/admin/shops/:id
export async function adminDeleteShop(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const shop = await prisma.supplyShop.findUnique({ where: { id } });
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    await prisma.supplyShop.delete({ where: { id } });
    res.json({ message: "Shop deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/admin/shops/:id/products
export async function adminAddProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id: shopId } = req.params;
    const shop = await prisma.supplyShop.findUnique({ where: { id: shopId } });
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    const { name, description, category, price, unit, quantity } = req.body;
    if (!name || !description || !category || !unit) {
      res.status(400).json({ error: "name, description, category, unit are required" }); return;
    }
    const p = parseFloat(price);
    const q = parseInt(quantity, 10);
    if (isNaN(p) || p <= 0) { res.status(400).json({ error: "price must be positive" }); return; }
    if (isNaN(q) || q < 0) { res.status(400).json({ error: "quantity must be non-negative" }); return; }
    const validCategories = ["SEEDS", "FERTILIZERS", "PESTICIDES", "TOOLS", "OTHER"];
    if (!validCategories.includes(category)) {
      res.status(400).json({ error: `category must be one of: ${validCategories.join(", ")}` }); return;
    }
    const product = await prisma.supplyProduct.create({
      data: { name: name.trim(), description: description.trim(), category, price: p, unit: unit.trim(), quantity: q, shopId, approvalStatus: "APPROVED" },
    });
    res.status(201).json({ data: product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// PATCH /api/admin/shops/:id/products/:productId
export async function adminUpdateProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { productId } = req.params;
    const { name, description, category, price, unit, quantity } = req.body;
    const p = price !== undefined ? parseFloat(price) : undefined;
    const q = quantity !== undefined ? parseInt(quantity, 10) : undefined;
    if (p !== undefined && (isNaN(p) || p <= 0)) { res.status(400).json({ error: "price must be positive" }); return; }
    if (q !== undefined && (isNaN(q) || q < 0)) { res.status(400).json({ error: "quantity must be non-negative" }); return; }
    const updated = await prisma.supplyProduct.update({
      where: { id: productId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description ? { description: description.trim() } : {}),
        ...(category ? { category } : {}),
        ...(p !== undefined ? { price: p } : {}),
        ...(unit ? { unit: unit.trim() } : {}),
        ...(q !== undefined ? { quantity: q } : {}),
      },
    });
    res.json({ data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// DELETE /api/admin/shops/:id/products/:productId
export async function adminDeleteProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { productId } = req.params;
    await prisma.supplyProduct.delete({ where: { id: productId } });
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
>>>>>>> main
