const express = require("express");
const router = express.Router();
const {
  getPosts,
  deletePost,
  getPostById,
  togglePostVisibility,
} = require("../controllers/postController");

const { createPost } = require("../controllers/createPostController");

// Route to fetch posts
router.get("/posts", getPosts);

router.post("/create-post", createPost);

// Route to delete a post
router.delete("/posts/:id", deletePost);

router.put("/posts/visibility", togglePostVisibility);

router.get("/posts/:id", getPostById); // ✅ add this

module.exports = router;
