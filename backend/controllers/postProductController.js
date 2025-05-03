// --postProductController.js --//
const PostProduct = require("../models/postProduct/PostProduct");
const admin = require("firebase-admin"); // Firebase Admin SDK
const db = admin.firestore();
const dbFirestore = admin.firestore();

exports.importFromFirebasePost = async (req, res) => {
  const postId = req.params.postId;

  console.log("🔍 postId:", postId);
  console.log("🔐 req.user:", req.user);
  console.log("📥 Request body:", req.body);

  try {
    // Check if this postId already exists in MongoDB
    const existing = await PostProduct.findOne({ postId });
    if (existing) {
      console.log("✅ Post already imported, skipping insert.");
      return res.status(200).json(existing); // ✅ return existing post
    }

    // Get post from Firestore
    const doc = await dbFirestore.collection("posts").doc(postId).get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Post not found in Firestore" });
    }

    const post = doc.data();

    // Fetch user data for role-based tags
    const userDoc = await dbFirestore
      .collection("users")
      .doc(post.userId)
      .get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const userRoles = Array.isArray(userData.role) ? userData.role : [];
    const combinedTags = Array.from(new Set(["public", ...userRoles]));

    // Create and save new product
    const newProduct = new PostProduct({
      userId: post.userId,
      postId: postId,
      name: post.caption || "No name",
      description: "No description",
      price: 0,
      imageUrl: post.imageUrl,
      tags: combinedTags,
    });

    await newProduct.save();
    res.status(201).json(newProduct); // ✅ Newly created
  } catch (err) {
    console.error("🚨 Error importing post:", err);
    res.status(500).json({ message: "Failed to import post" });
  }
};

// CREATE
exports.createPostProduct = async (req, res) => {
  try {
    const { userId, tenantId, name, price, description, imageUrl } = req.body;

    const newProduct = new PostProduct({
      userId,
      tenantId,
      name,
      price,
      description,
      imageUrl,
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Error saving product:", err);
    res.status(500).json({ message: "Failed to save product." });
  }
};

// READ - All
exports.getAllPostProducts = async (req, res) => {
  try {
    const products = await PostProduct.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products." });
  }
};
//---------------------------------------------------
// postProductController.js
exports.getMarketingMediaByUser = async (req, res) => {
  const userId = req.params.userId;
  console.log("userId :", userId);
  try {
    const marketingPosts = await PostProduct.find({
      userId,
      tags: { $in: ["merchant", "market", "marketing"] },
    });

    res.json({ posts: marketingPosts, videos: [] });
  } catch (err) {
    console.error("Error fetching marketing content:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getPostProductsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const products = await PostProduct.find({ userId });
    res.status(200).json(products); // ✅ Return array, not object
  } catch (error) {
    console.error("Error fetching user products:", error);
    res.status(500).json({ message: "Failed to fetch products." });
  }
};

// ----- READ - Single  ------------------------------------
exports.getPostProduct = async (req, res) => {
  try {
    const product = await PostProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// UPDATE
exports.updatePostProduct = async (req, res) => {
  try {
    const updated = await PostProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product" });
  }
};

// DELETE
exports.deletePostProduct = async (req, res) => {
  try {
    const deleted = await PostProduct.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};
