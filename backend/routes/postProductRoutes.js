// //---- app.use("/api/products", postProductRoutes); ----//
const express = require("express");
const router = express.Router();
// Correct import at the top
const {
  createPostProduct,
  getAllPostProducts,
  getAllMarketplaceProducts,
  getPostProduct,
  updatePostProduct,
  importFromFirebasePost,
  deletePostProduct,
  getMarketingMediaByUser,
  grantPrivateAccessToClientFirebase,
  getPrivatePostsByClientFirebase,
  grantPrivateAccessToClient,
  getPrivatePostsByClient, // ✅ make sure it's listed here
} = require("../controllers/postProductController");

const authenticateAndAuthorize = require("../middlewares/authMiddleware");

// 🔐 Create a new product post
router.post("/add", authenticateAndAuthorize(), createPostProduct);

// 🔓 Public: Get all products for dashboard/admin
router.get("/", getAllPostProducts);

// 🔓 Public: Marketplace
router.get("/marketplace", getAllMarketplaceProducts);

// 🔓 Get a post by ID
router.get("/:id", getPostProduct);

// 🔐 Update a post
router.put("/:id", authenticateAndAuthorize(), updatePostProduct);

// 🔐 Import post from Firebase
router.post(
  "/import-from-post/:postId",
  authenticateAndAuthorize(),
  importFromFirebasePost
);

// // Grant access to private post (Firestore)
router.post(
  "/:postId/grant-accessFirebase",
  authenticateAndAuthorize(),
  grantPrivateAccessToClientFirebase
);

router.get(
  "/private/by-clientFirebase",
  authenticateAndAuthorize(),
  getPrivatePostsByClientFirebase
);

// Get private posts for client (Mongo)
router.post(
  "/:postId/grant-access",
  authenticateAndAuthorize(),
  grantPrivateAccessToClient
);

router.get(
  "/private/by-client",
  // authenticateAndAuthorize(),
  getPrivatePostsByClient
);

// 🔐 Get posts by logged-in user's ID
router.get(
  "/by-user/:userId",
  authenticateAndAuthorize(),
  getMarketingMediaByUser
);

// 🔐 Get private posts allowed for a specific client (uses req.user.email or uid)
router.get(
  "/private/client",
  authenticateAndAuthorize(),
  getPrivatePostsByClient
);

// 🔐 Delete post (by ID)
router.delete("/:id", authenticateAndAuthorize(), deletePostProduct);

module.exports = router;
