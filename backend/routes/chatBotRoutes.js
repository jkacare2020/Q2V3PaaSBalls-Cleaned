// ------------chatBotRoutes.js -------------
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
  logVisionResult, // ✅ Add this
  getVisionLogsByUser,
  getLatestVisionEval,
  getVisionEvalBySessionId,
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

// Save GPT-4 Vision result with image URLs and metadata
router.post("/chatbot/vision-log", logVisionResult);

router.get("/chatbot/vision-logs", getVisionLogsByUser);

router.get("/chatbot/latest-vision-eval", getLatestVisionEval);

router.get("/chatbot/vision-eval/:sessionId", getVisionEvalBySessionId);

module.exports = router;
