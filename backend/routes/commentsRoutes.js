// backend/routes/commentsRoutes.js
const express = require("express");
const router = express.Router();

// Make sure this matches your actual file and function names
const {
  addComment,
  getComments, // ❗ This must be exported from your controller
} = require("../controllers/commentsController");

router.post("/add", addComment);
router.get("/:postId", getComments); // This is where it crashes if undefined

module.exports = router;
