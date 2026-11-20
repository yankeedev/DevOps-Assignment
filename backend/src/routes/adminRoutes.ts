import { Router } from "express";
import {
  getStats,
  listAllEquipment,
  listPendingEquipment,
  approveEquipment,
  rejectEquipment,
  listAllUsers,
  listAllBookings,
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

export default router;
