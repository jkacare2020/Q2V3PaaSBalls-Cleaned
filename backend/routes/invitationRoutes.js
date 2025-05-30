// routes/invitationRoutes.js
const express = require("express");
const {
  acceptInvite,
  getPendingInvite,
  declineInvite, // ⬅️ Add this for remove
} = require("../controllers/invitationController");
// const authenticateAndAuthorize = require("../middlewares/authMiddleware");

const router = express.Router();

// Check if the logged-in client has a pending invite
router.get("/pending", getPendingInvite);

// Accept the invite
router.post("/accept", acceptInvite);

router.post("/decline", declineInvite);

module.exports = router;
