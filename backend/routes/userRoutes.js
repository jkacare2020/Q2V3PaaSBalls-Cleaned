// backend/routes/userRoutes.js

const express = require("express");
const router = express.Router();
const { getAllUsers } = require("../controllers/userController");
// const authenticateAndAuthorize = require("../middlewares/authMiddleware");

/**
 * @route GET /api/mongo-users
 * @desc Get all users from MongoDB (Admin only)
 * @access Protected (Admin)
 */
router.get("/mongo-users", getAllUsers);

module.exports = router;
