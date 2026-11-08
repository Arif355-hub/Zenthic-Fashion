const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  addProductReview,
  deleteProduct,
  updateProduct,
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

// Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin-only route
router.post("/", protect, admin, createProduct);

// Delete product (Admin only)
router.delete("/:id", protect, admin, deleteProduct);

// Update product (Admin only)
router.put("/:id", protect, admin, updateProduct);

// Add product review
router.post("/:id/reviews", protect, addProductReview);

module.exports = router;