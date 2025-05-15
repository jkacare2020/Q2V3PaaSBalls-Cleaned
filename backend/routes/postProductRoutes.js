//---- app.use("/api/products", postProductRoutes); ----//
const express = require("express");
const router = express.Router();
const postProductController = require("../controllers/postProductController");
const { verifyFirebaseToken } = require("../middlewares/authMiddleware");
const { deletePostProduct } = require("../controllers/postProductController");

// Create new post
router.post("/add", postProductController.createPostProduct);

// Get all products (for dashboard)
router.get("/", postProductController.getAllPostProducts);

// routes/productRoutes.js
router.get("/marketplace", postProductController.getAllMarketplaceProducts);

// Get a single post by ID ---------------------------
router.get("/:id", postProductController.getPostProduct);

// update a single post by ID
router.put("/:id", postProductController.updatePostProduct);

router.post(
  "/import-from-post/:postId",
  postProductController.importFromFirebasePost
);

// Delete a single post by ID
// router.delete("/:id", postProductController.deletePostProduct);

router.get("/by-user/:userId", postProductController.getMarketingMediaByUser);

router.delete("/products/:id", deletePostProduct);

module.exports = router;
