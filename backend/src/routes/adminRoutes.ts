import { Router } from 'express'
import { requireAdmin } from '../middleware/adminAuth'
import {
  listPendingEquipment,
  approveEquipment,
  rejectEquipment,
} from '../controllers/adminEquipmentController'

const router = Router()

router.use(requireAdmin)

router.get('/equipment/pending',         listPendingEquipment)
router.patch('/equipment/:id/approve',   approveEquipment)
router.patch('/equipment/:id/reject',    rejectEquipment)

export default router
