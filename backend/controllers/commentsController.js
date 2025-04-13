//--------commentsController.js---------
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
//------------------GET Comments ------------------------
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
//------------------UPDATE Comment ------------------------
exports.updateComment = async (req, res) => {
  const { commentId, postId = "global", newText } = req.body;
  const userId = req.user?.uid;

  if (!userId) return res.status(401).send("Unauthorized");

  try {
    const commentRef = admin.database().ref(`comments/${postId}/${commentId}`);
    const snapshot = await commentRef.once("value");

    if (!snapshot.exists()) {
      return res.status(404).send("Comment not found.");
    }

    const existingComment = snapshot.val();

    // ✅ Ensure user owns the comment
    if (existingComment.userId !== userId) {
      return res
        .status(403)
        .send("Forbidden: You can only update your own comment.");
    }
    //-------------------- Set Status of Online--------------------------------
    await commentRef.update({
      text: newText,
      edited: true,
      editedAt: Date.now(),
      ...(req.body.online !== undefined && { online: req.body.online }), // ✅ dynamic toggle
    });

    res.send("Comment updated successfully.");
  } catch (err) {
    console.error("❌ Error updating comment:", err);
    res.status(500).send("Error updating comment.");
  }
};
//----------------update online status during logout ----------
exports.markAllCommentsOffline = async (req, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).send("Unauthorized");

  try {
    const commentsRef = admin.database().ref("comments/global");
    const snapshot = await commentsRef.once("value");

    const updates = {};
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.userId === userId) {
        updates[`${child.key}/online`] = false;
      }
    });

    await commentsRef.update(updates);
    res.send("All user comments marked offline.");
  } catch (err) {
    console.error("Error marking comments offline:", err);
    res.status(500).send("Failed to update comments.");
  }
};
//-------------Login set online : true  ------
// 🔁 In commentsController.js
exports.markAllCommentsOnline = async (req, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).send("Unauthorized");

  try {
    const commentsRef = admin.database().ref("comments/global");
    const snapshot = await commentsRef.once("value");

    const updates = {};
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.userId === userId) {
        updates[`${child.key}/online`] = true;
      }
    });

    await commentsRef.update(updates);
    res.send("All user comments marked online.");
  } catch (err) {
    console.error("Error marking comments online:", err);
    res.status(500).send("Failed to update comments.");
  }
};
