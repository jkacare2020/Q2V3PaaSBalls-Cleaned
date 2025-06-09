const admin = require("firebase-admin");
const dbFirestore = admin.firestore(); // Firestore instance

exports.getPosts = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send("Unauthorized");
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const db = admin.firestore();

    const posts = [];

    // ✅ 1. Get all public posts
    const publicSnapshot = await db
      .collection("posts")
      .where("tags", "array-contains", "public")
      .orderBy("date", "desc")
      .get();

    publicSnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    // ✅ 2. Get this user's private (or any) posts not already included
    const userSnapshot = await db
      .collection("posts")
      .where("userId", "==", userId)
      .orderBy("date", "desc")
      .get();

    userSnapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() };

      // 🔁 Avoid duplicate if already in public set
      if (!posts.find((p) => p.id === doc.id)) {
        posts.push(data);
      }
    });

    // ✅ Optional: sort again by date after merging (if order matters globally)
    posts.sort((a, b) => b.date - a.date);

    res.send(posts);
  } catch (error) {
    console.error("Error fetching Firestore posts:", error);
    res.status(500).send("Error fetching posts");
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split(" ")[1];
    if (!idToken) {
      return res.status(401).send("Unauthorized: Missing Firebase token");
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const postId = req.params.id;
    const postRef = dbFirestore.collection("posts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists || postDoc.data().userId !== userId) {
      return res
        .status(403)
        .send("Unauthorized: You can only delete your own posts");
    }

    await postRef.delete();
    res.status(200).send({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).send("Unauthorized: Invalid Firebase token");
  }
};
//---------------------------------------------
exports.togglePostVisibility = async (req, res) => {
  const { postId, visibility } = req.body;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send("Unauthorized");
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const postRef = admin.firestore().collection("posts").doc(postId);
    const postSnap = await postRef.get();

    if (!postSnap.exists) {
      return res.status(404).send("Post not found");
    }

    const post = postSnap.data();

    if (post.userId !== userId) {
      return res.status(403).send("Forbidden: You do not own this post");
    }

    // Update tags field
    let updatedTags = [];

    if (visibility === "public") {
      updatedTags = ["public"];
    } else if (visibility === "private") {
      updatedTags = ["private"];
    } else if (visibility === "marketplace") {
      updatedTags = ["public", "marketplace"]; // always include 'public'
    } else {
      return res.status(400).send("Invalid visibility value");
    }

    await postRef.update({
      tags: updatedTags,
    });

    res.send("Post visibility updated successfully");
  } catch (err) {
    console.error("❌ Error updating post visibility:", err);
    res.status(500).send("Server error while updating visibility");
  }
};

exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const postDoc = await dbFirestore.collection("posts").doc(postId).get();

    if (!postDoc.exists) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.status(200).json(postDoc.data());
  } catch (error) {
    console.error("Error fetching post:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
//---------------------------------------------------------
exports.getMyPosts = async (req, res) => {
  try {
    const userId = req.user.uid; // assuming you use Firebase Auth middleware

    const snapshot = await dbFirestore
      .collection("posts")
      .where("userId", "==", userId)
      .orderBy("date", "desc")
      .get();

    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(posts);
  } catch (err) {
    console.error("Error fetching user posts:", err);
    return res.status(500).json({ message: "Failed to fetch your posts" });
  }
};

// GET /api/posts/from-clients
exports.getAssignedClientPosts = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const merchantId = decoded.uid;

    console.log("🔐 Auth middleware hit for:", merchantId);

    const db = admin.firestore();
    const merchantDoc = await db.collection("users").doc(merchantId).get();
    const assignedClients = merchantDoc.data()?.assignedClients || {};
    const clientIds = Object.keys(assignedClients);

    console.log("👥 Assigned client IDs:", clientIds);

    if (clientIds.length === 0) return res.json([]);

    const posts = [];

    for (const clientId of clientIds) {
      const snapshot = await db
        .collection("posts")
        .where("userId", "==", clientId)
        .where("tags", "array-contains", "private")
        .orderBy("date", "desc")
        .get();

      snapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
    }

    console.log("📷 Returning posts:", posts.length);
    return res.json(posts); // ✅ explicitly return JSON
  } catch (error) {
    console.error("❌ Error in getAssignedClientPosts:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
// controllers/postProductController.js
// controllers/postProductController.js
const PostProduct = require("../models/postProduct/PostProduct");

exports.grantPrivateAccessBatch = async (req, res) => {
  try {
    const { postIds, email, phone, passcode } = req.body;
    const userId = req.user.uid; // 🔐 comes from Firebase Auth middleware

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ message: "No postIds provided." });
    }

    if (!email || !passcode) {
      return res
        .status(400)
        .json({ message: "Email and passcode are required." });
    }

    const updateData = {
      $addToSet: {
        privateAccess: {
          email,
          phone,
          passcode,
          grantedBy: userId,
          grantedAt: new Date(),
        },
      },
    };

    const result = await PostProduct.updateMany(
      { postId: { $in: postIds } },
      updateData
    );

    return res.status(200).json({
      message: "Access granted to selected posts.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error granting batch access:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
