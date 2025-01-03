const mongoose = require("mongoose");

const VideoPostSchema = new mongoose.Schema(
  {
    caption: { type: String, required: true },
    location: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    videoURL: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VideoPost", VideoPostSchema);
