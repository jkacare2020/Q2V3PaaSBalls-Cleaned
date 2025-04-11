//--------commentsController.js----------Updated ------
const admin = require("../config/firebaseAdmin");

exports.addComment = async (req, res) => {
  const { text, postId = "global" } = req.body;
  const userId = req.user?.uid;
  if (!userId) return res.status(401).send("Unauthorized: Missing user ID");

  try {
    // ✅ 1. Fetch user info
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
    const userData = userDoc.exists ? userDoc.data() : {};
    // ✅ Correct: .exists (not .exists())

    // ✅ 2. Get avatar if exists
    let avatarUrl = "";
    const avatarSnap = await admin
      .firestore()
      .collection(`users/${userId}/avatar`)
      .limit(1)
      .get();

    if (!avatarSnap.empty) {
      avatarUrl = avatarSnap.docs[0].data().imageUrl;
    }

    // ✅ 3. Check presence from Realtime DB
    const presenceSnap = await admin
      .database()
      .ref(`usersPresence/${userId}`)
      .once("value");
    const presenceData = presenceSnap.exists() ? presenceSnap.val() : {};
    const isOnline = !!presenceData.online;

    // ✅ 4. Save comment
    const commentRef = admin.database().ref(`comments/${postId}`).push();
    await commentRef.set({
      userId,
      text,
      timestamp: Date.now(),
      displayName: userData.displayName || "User",
      userName: userData.userName, // ✅ Save username too
      avatarUrl: avatarUrl || "",
      online: isOnline,
    });

    res.send("Comment added successfully.");
  } catch (err) {
    console.error("❌ Error adding comment:", err);
    res.status(500).send("Error adding comment");
  }
};

exports.getComments = async (req, res) => {
  const { postId } = req.params;
  try {
    const snapshot = await admin
      .database()
      .ref(`comments/${postId}`)
      .once("value");
    res.send(snapshot.val());
  } catch (err) {
    console.error("❌ Error fetching comments:", err);
    res.status(500).send("Error fetching comments");
  }
};
