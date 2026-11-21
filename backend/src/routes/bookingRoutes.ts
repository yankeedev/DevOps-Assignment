import { Router } from "express";
import {
  createBooking,
  listMyBookings,
  listIncomingBookings,
  approveBooking,
  rejectBooking,
  cancelBooking,
} from "../controllers/bookingController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.post("/", createBooking);
router.get("/mine", listMyBookings);
router.get("/incoming", listIncomingBookings);
router.patch("/:id/approve", approveBooking);
router.patch("/:id/reject", rejectBooking);
router.patch("/:id/cancel", cancelBooking);

export default router;
