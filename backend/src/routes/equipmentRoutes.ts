import { Router } from "express";
import {
  createEquipment,
  listAvailableEquipment,
  listMyEquipment,
} from "../controllers/equipmentController";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.get("/", listAvailableEquipment);
router.get("/mine", requireAuth, requireRole("EQUIPMENT_OWNER"), listMyEquipment);
router.post("/", requireAuth, requireRole("EQUIPMENT_OWNER"), createEquipment);

export default router;