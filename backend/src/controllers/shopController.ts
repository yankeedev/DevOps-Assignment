import { Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

// GET /api/shops — list all shops with products
export async function listShops(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const shops = await prisma.supplyShop.findMany({
      include: {
        owner: { select: { id: true, name: true } },
        products: {
          where: { approvalStatus: "APPROVED" },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: shops });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// GET /api/shops/mine — owner views their own shop
export async function getMyShop(req: AuthRequest, res: Response): Promise<void> {
  try {
    const shop = await prisma.supplyShop.findFirst({
      where: { ownerId: req.user!.userId },
      include: { products: { orderBy: { createdAt: "desc" } } },
    });
    res.json({ data: shop ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/shops — create shop
export async function createShop(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, description, phone, address, district, sector } = req.body;
    const missing = (["name", "description", "phone", "address", "district", "sector"] as const)
      .filter(f => !req.body[f]?.trim());
    if (missing.length) { res.status(400).json({ error: `Missing: ${missing.join(", ")}` }); return; }

    const existing = await prisma.supplyShop.findFirst({ where: { ownerId: req.user!.userId } });
    if (existing) { res.status(409).json({ error: "You already have a shop" }); return; }

    const shop = await prisma.supplyShop.create({
      data: {
        name: name.trim(), description: description.trim(), phone: phone.trim(),
        address: address.trim(), district: district.trim(), sector: sector.trim(),
        ownerId: req.user!.userId,
      },
      include: { products: true },
    });
    res.status(201).json({ data: shop });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// PATCH /api/shops/:id — update shop
export async function updateShop(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const shop = await prisma.supplyShop.findUnique({ where: { id } });
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    if (shop.ownerId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

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
      include: { products: { orderBy: { createdAt: "desc" } } },
    });
    res.json({ data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/shops/:id/products — add product to shop
export async function addProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id: shopId } = req.params;
    const shop = await prisma.supplyShop.findUnique({ where: { id: shopId } });
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    if (shop.ownerId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

    const { name, description, category, price, unit, quantity } = req.body;
    const missing = (["name", "description", "category", "unit"] as const)
      .filter(f => !req.body[f]?.trim());
    if (missing.length) { res.status(400).json({ error: `Missing: ${missing.join(", ")}` }); return; }

    const p = parseFloat(price);
    const q = parseInt(quantity, 10);
    if (isNaN(p) || p <= 0) { res.status(400).json({ error: "price must be a positive number" }); return; }
    if (isNaN(q) || q < 0) { res.status(400).json({ error: "quantity must be a non-negative integer" }); return; }

    const validCategories = ["SEEDS", "FERTILIZERS", "PESTICIDES", "TOOLS", "OTHER"];
    if (!validCategories.includes(category)) {
      res.status(400).json({ error: `category must be one of: ${validCategories.join(", ")}` });
      return;
    }

    const product = await prisma.supplyProduct.create({
      data: {
        name: name.trim(), description: description.trim(),
        category, price: p, unit: unit.trim(), quantity: q,
        shopId, approvalStatus: "APPROVED",
      },
    });
    res.status(201).json({ data: product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// PATCH /api/shops/:id/products/:productId — update product
export async function updateProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id: shopId, productId } = req.params;
    const shop = await prisma.supplyShop.findUnique({ where: { id: shopId } });
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    if (shop.ownerId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

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

// DELETE /api/shops/:id/products/:productId
export async function deleteProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id: shopId, productId } = req.params;
    const shop = await prisma.supplyShop.findUnique({ where: { id: shopId } });
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    if (shop.ownerId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }
    await prisma.supplyProduct.delete({ where: { id: productId } });
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
