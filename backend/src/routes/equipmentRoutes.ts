import { Router } from "express";
import {
  createEquipment,
  listAvailableEquipment,
  listMyEquipment,
  getEquipmentById,
  updateEquipment,
} from "../controllers/equipmentController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", listAvailableEquipment);
router.get("/mine", requireAuth, listMyEquipment);
router.get("/:id", getEquipmentById);
router.post("/", requireAuth, createEquipment);
router.patch("/:id", requireAuth, updateEquipment);

export default router;
