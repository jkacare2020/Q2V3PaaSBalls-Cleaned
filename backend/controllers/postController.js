const admin = require("firebase-admin");
const dbFirestore = admin.firestore(); // Firestore instance

// Fetch posts
exports.getPosts = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send("Unauthorized");
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    let posts = [];
    const snapshot = await dbFirestore
      .collection("posts")
      .where("userId", "==", userId)
      .orderBy("date", "desc")
      .get();

    snapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });

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
