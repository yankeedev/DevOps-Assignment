import { Router } from 'express'
import {
  createEquipment,
  listAvailableEquipment,
  listOwnerEquipment,
} from '../controllers/equipmentController'

const router = Router()

router.get('/',                    listAvailableEquipment)
router.get('/owner/:ownerId',      listOwnerEquipment)
router.post('/',                   createEquipment)

export default router
