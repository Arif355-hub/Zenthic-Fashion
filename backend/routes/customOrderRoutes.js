const express = require("express");
const router = express.Router();

const {
  upload,
  validateArtworkFile,
} = require("../middleware/uploadMiddleware");
const {
  createCustomOrder,
  getMyCustomOrders,
  getAllCustomOrders,
  updateCustomOrderQuote,
  respondToCustomOrderQuote,
  updateCustomOrderStatus,
  cancelCustomOrder,
  getMyCustomOrderById,
  getCustomOrderById,
  getCustomOrderStats,
  exportCustomOrdersCSV,
} = require("../controllers/customOrderController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

// Customer custom order submit karega
router.post("/", protect,  upload.single("artwork"), validateArtworkFile, createCustomOrder);

// Customer apne custom orders dekhega
router.get("/my-orders", protect, getMyCustomOrders);

// Admin: Get all custom orders
router.get("/", protect, admin, getAllCustomOrders);

// Admin: Update custom order quotation
router.put("/:id/quote", protect, admin, updateCustomOrderQuote);

// Customer: Accept or reject quotation
router.put("/:id/quote-response", protect, respondToCustomOrderQuote);

// Admin: Update custom order production status
router.put("/:id/status", protect, admin, updateCustomOrderStatus);

// Customer: Cancel custom order
router.put("/:id/cancel", protect, cancelCustomOrder);

// Customer: Get a specific custom order by ID
router.get("/my-orders/:id", protect, getMyCustomOrderById);

// Admin: Get custom order statistics
router.get("/admin/stats", protect, admin, getCustomOrderStats);

// Admin: Export custom orders to CSV
router.get("/admin/export", protect, admin, exportCustomOrdersCSV);

// Admin: Get a specific custom order by ID
router.get("/admin/:id", protect, admin, getCustomOrderById);

module.exports = router;