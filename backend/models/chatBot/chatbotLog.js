// chatbotLogs.js
const mongoose = require("mongoose");

const ChatbotLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  sessionId: { type: String, required: true },
  query: { type: String, required: true },
  response: { type: mongoose.Schema.Types.Mixed, required: true }, // ✅ Crucial correction
  modelUsed: { type: String, default: "gpt-4-turbo" },
  tokensUsed: { type: Number, default: 0 },
  confidenceScore: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now },
  imageUrls: [String], // 👈 new
  type: { type: String }, // e.g., 'vision'
  tags: [String], // e.g., ['reference', 'carpet']
});

module.exports = mongoose.model("ChatbotLog", ChatbotLogSchema);
