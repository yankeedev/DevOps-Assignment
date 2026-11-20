import { Router } from "express";
import { listReviews, createOrUpdateReview, deleteReview } from "../controllers/reviewController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router({ mergeParams: true }); // mergeParams to get :id from parent

router.get("/", listReviews);
router.post("/", requireAuth, createOrUpdateReview);
router.delete("/", requireAuth, deleteReview);

export default router;
