const ChatbotLog = require("../models/ChatbotLog");

/**
 * Save GPT-4 Vision result to MongoDB ChatbotLog
 * @param {Object} params
 * @param {string} params.userId - Firebase UID
 * @param {string[]} params.imageUrls - Array of related image URLs
 * @param {string} params.prompt - Original prompt sent to GPT
 * @param {string|object} params.response - GPT's raw response (can be structured)
 * @param {string} [params.modelUsed="gpt-4-vision-preview"]
 * @param {number} [params.tokensUsed=0]
 * @param {number} [params.score] - Optional AI-estimated restoration %
 * @param {string[]} [params.tags] - e.g., ["bag", "reference"]
 */
async function logVisionResult({
  userId,
  imageUrls,
  prompt,
  response,
  modelUsed = "gpt-4-vision-preview",
  tokensUsed = 0,
  score,
  tags = [],
}) {
  const sessionId = `vision-${userId}-${Date.now()}`;

  const log = new ChatbotLog({
    userId,
    sessionId,
    query: prompt,
    response,
    modelUsed,
    tokensUsed,
    confidenceScore: 1,
    imageUrls,
    type: "vision",
    tags,
  });

  if (typeof score === "number") {
    log.response.score = score;
  }

  await log.save();
}

module.exports = logVisionResult;
