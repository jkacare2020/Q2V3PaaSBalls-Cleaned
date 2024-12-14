const mongoose = require("mongoose");

const gptModelSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Firebase UID
  originalImageUrl: { type: String, required: true }, // URL to the original image in Firebase Storage
  processedData: { type: mongoose.Schema.Types.Mixed, required: true }, // Data from GPT model
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GptModel", gptModelSchema);
