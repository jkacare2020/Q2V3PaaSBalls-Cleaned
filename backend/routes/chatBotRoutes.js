const express = require("express");
const router = express.Router();
const chatBotController = require("../controllers/chatBotController");

console.log("chatBotController:", chatBotController);
console.log("sendMessage function:", typeof chatBotController.sendMessage);

const {
  postLogs,
  deleteLog,
  sendMessage,
  getChatSessions,
  getChatBySession,
  getChatHistory,
} = require("../controllers/chatBotController");

// Route for sending a new message to GPT
router.post("/chatbot/sendMessage", sendMessage);

// Route for posting a new chatbot interaction or query
router.post("/chatbot/post", postLogs);

router.delete("/chatbot/:id", deleteLog);

// Fetch chat sessions
router.get("/chatbot/sessions", getChatSessions);

// Fetch chat history by sessionId
router.get("/chatbot/history/:sessionId", getChatBySession);

router.get("/chatbot/history", getChatHistory);

module.exports = router;
