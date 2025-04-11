// backend/utils/comments.js
const admin = require("../config/firebaseAdmin");

async function addComment(postId, commentData) {
  const db = admin.database();
  const commentRef = db.ref(`comments/${postId}`).push();
  await commentRef.set({
    userId: commentData.userId,
    text: commentData.text,
    timestamp: Date.now(),
  });
}

module.exports = { addComment };
