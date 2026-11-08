const express = require("express");
const router = express.Router();
const { authLimiter } = require("../middleware/rateLimitMiddleware");
const {
  registerUser,
  loginUser
} = require("../controllers/authController");

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);

module.exports = router;