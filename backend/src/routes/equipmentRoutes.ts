<<<<<<<<< Temporary merge branch 1
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
=========
import { Router } from "express";
import {
  createEquipment,
  listAvailableEquipment,
  listMyEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
} from "../controllers/equipmentController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", listAvailableEquipment);
router.get("/mine", requireAuth, listMyEquipment);
router.get("/:id", getEquipmentById);
router.post("/", requireAuth, createEquipment);
router.patch("/:id", requireAuth, updateEquipment);
router.delete("/:id", requireAuth, deleteEquipment);

export default router;
>>>>>>> main
