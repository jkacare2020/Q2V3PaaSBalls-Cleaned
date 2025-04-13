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
  const { postId, makePublic } = req.body;

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
    const tags = post.tags || [];
    let updatedTags;

    if (makePublic) {
      updatedTags = Array.from(new Set([...tags, "public"])).filter(
        (t) => t !== "private"
      );
    } else {
      updatedTags = Array.from(new Set([...tags, "private"])).filter(
        (t) => t !== "public"
      );
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
