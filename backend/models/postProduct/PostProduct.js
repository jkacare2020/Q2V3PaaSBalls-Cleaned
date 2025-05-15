const mongoose = require("mongoose");

const PostProductSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String }, // ✅ Add seller's username
    displayName: { type: String }, // ✅ Add seller's display name
    tenantId: { type: String },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    imageUrl: { type: String },
    category: { type: String },
    tags: [String],
    visibility: { type: String, default: "public" },
    postId: { type: String, required: true, unique: true }, // ✅ enforce uniqueness
  },
  { timestamps: true }
);

const PostProduct = mongoose.model("PostProduct", PostProductSchema);
module.exports = PostProduct;
