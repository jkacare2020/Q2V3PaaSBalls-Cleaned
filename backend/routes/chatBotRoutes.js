const express = require("express");
const router = express.Router();
const {
  getAllLogs,
  getLogs,
  postLogs,
  deleteLog,
} = require("../controllers/chatBotController");

// Route for posting a new chatbot interaction or query
router.post("/chatbot/post", postLogs);

// Route for retrieving a specific chatbot log by ID
router.get("/chatbot/:id", getLogs);

// Route for retrieving all chatbot logs
router.get("/chatbot", getAllLogs);

// Route for deleting a specific chatbot log by ID
router.delete("/chatbot/:id", deleteLog);

module.exports = router;
