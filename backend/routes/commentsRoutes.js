// backend/routes/commentsRoutes.js
const express = require("express");
const router = express.Router();
// ✅ Correct
const authenticate = require("../middlewares/authMiddleware");

// Make sure this matches your actual file and function names
const {
  addComment,
  getComments, // ❗ This must be exported from your controller
  updateComment,
  markAllCommentsOffline,
  markAllCommentsOnline,
} = require("../controllers/commentsController");

router.post("/add", addComment);
router.get("/:postId", getComments); // This is where it crashes if undefined
router.put("/update", updateComment);
router.post("/markOffline", markAllCommentsOffline);
router.post("/markOnline", markAllCommentsOnline);

module.exports = router;
