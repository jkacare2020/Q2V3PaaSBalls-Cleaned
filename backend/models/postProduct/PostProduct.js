// models/postProduct/PostProduct.js
const mongoose = require("mongoose");

const PrivateAccessSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    phone: { type: String },
    passcode: { type: String }, // you can keep this optional or required if needed
    grantedBy: { type: String, required: true },
    grantedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PostProductSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String },
    displayName: { type: String },
    companyName: { type: String },
    tenantId: { type: String },

    name: { type: String, required: true },
    description: { type: String, default: "No description" },
    price: { type: Number, required: true, default: 0 },

    imageUrl: { type: String },
    category: { type: String },

    tags: [String],

    // ✅ Enforced visibility
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    // 🔗 Firebase post reference
    postId: { type: String, required: true, unique: true },

    // 🔐 Access control list for private sharing
    privateAccess: [PrivateAccessSchema],
  },
  { timestamps: true }
);

// ✅ Optional: add compound index to enforce user-specific uniqueness
// PostProductSchema.index({ userId: 1, postId: 1 }, { unique: true });

const PostProduct = mongoose.model("PostProduct", PostProductSchema);
module.exports = PostProduct;
