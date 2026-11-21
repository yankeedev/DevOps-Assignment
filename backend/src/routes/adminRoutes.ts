<<<<<<< HEAD
import { Router } from "express";
import {
  listPendingEquipment,
  approveEquipment,
  rejectEquipment,
} from "../controllers/adminEquipmentController";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/equipment/pending", listPendingEquipment);
router.patch("/equipment/:id/approve", approveEquipment);
router.patch("/equipment/:id/reject", rejectEquipment);

export default router;
=======
import { Router } from "express";
import {
  getStats,
  listAllEquipment,
  listPendingEquipment,
  approveEquipment,
  rejectEquipment,
  listAllUsers,
  listAllBookings,
  adminListShops,
  adminCreateShop,
  adminUpdateShop,
  adminDeleteShop,
  adminAddProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from "../controllers/adminEquipmentController";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/stats", getStats);
router.get("/equipment", listAllEquipment);
router.get("/equipment/pending", listPendingEquipment);
router.patch("/equipment/:id/approve", approveEquipment);
router.patch("/equipment/:id/reject", rejectEquipment);
router.get("/users", listAllUsers);
router.get("/bookings", listAllBookings);
router.get("/shops", adminListShops);
router.post("/shops", adminCreateShop);
router.patch("/shops/:id", adminUpdateShop);
router.delete("/shops/:id", adminDeleteShop);
router.post("/shops/:id/products", adminAddProduct);
router.patch("/shops/:id/products/:productId", adminUpdateProduct);
router.delete("/shops/:id/products/:productId", adminDeleteProduct);

export default router;
>>>>>>> main
