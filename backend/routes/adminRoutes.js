// backend/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const admin = require("../config/firebaseAdmin");
const authenticateAndAuthorize = require("../middlewares/authMiddleware");

// 🔒 Admin-only route to set custom roles
router.post(
  "/set-user-role",
  authenticateAndAuthorize(["admin"]),
  async (req, res) => {
    try {
      const { uid, roles } = req.body;

      if (!uid || !Array.isArray(roles)) {
        return res
          .status(400)
          .json({ message: "Invalid input: uid and roles[] required" });
      }

      await admin.auth().setCustomUserClaims(uid, { role: roles });
      res.status(200).json({ message: `Roles [${roles}] set for user ${uid}` });
    } catch (error) {
      console.error("Error setting custom roles:", error);
      res.status(500).json({ message: "Failed to set roles" });
    }
  }
);

module.exports = router;
