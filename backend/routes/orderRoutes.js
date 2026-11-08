const { admin } = require("../middleware/adminMiddleware");
const express = require("express");
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelMyOrder,
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");

// Create new order
router.post("/", protect, createOrder);

// Get logged-in customer's orders
router.get("/my-orders", protect, getMyOrders);

// Admin: Get all customer orders
router.get("/", protect, admin, getAllOrders);

// Admin: Update order status
router.put("/:id/status", protect, admin, updateOrderStatus);

// Get single order details
router.get("/:id", protect, getOrderById);

// Cancel my order
router.put("/:id/cancel", protect, cancelMyOrder);

module.exports = router;