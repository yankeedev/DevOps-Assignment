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