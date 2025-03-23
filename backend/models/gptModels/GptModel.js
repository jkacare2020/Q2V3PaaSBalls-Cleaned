const mongoose = require("mongoose");

const AIModelSchema = new mongoose.Schema({
  modelName: { type: String, required: true },
  version: { type: String, required: true },
  description: String,
  createdBy: { type: String, required: true }, // Owner's UID
  storagePath: { type: String, required: true }, // Path in Firestore or S3
  createdAt: { type: Date, default: Date.now },
});
