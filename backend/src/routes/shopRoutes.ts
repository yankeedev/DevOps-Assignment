import { Router } from "express";
import {
  listShops, getMyShop, createShop, updateShop,
  addProduct, updateProduct, deleteProduct,
} from "../controllers/shopController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", listShops);
router.get("/mine", requireAuth, getMyShop);
router.post("/", requireAuth, createShop);
router.patch("/:id", requireAuth, updateShop);
router.post("/:id/products", requireAuth, addProduct);
router.patch("/:id/products/:productId", requireAuth, updateProduct);
router.delete("/:id/products/:productId", requireAuth, deleteProduct);

export default router;
