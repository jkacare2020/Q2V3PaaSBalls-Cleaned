// backend/routes/registerClientRoutes.js
const express = require("express");
const router = express.Router();
const { registerClient } = require("../controllers/registerClientController");
const authenticateAndAuthorize = require("../middlewares/authMiddleware");

// 🔐 Only merchant can register a client manually
router.post(
  "/register-client",
  authenticateAndAuthorize(["merchant"]),
  registerClient
);

module.exports = router;
