// backend/utils/setUserPresence.js
const admin = require("../config/firebaseAdmin"); // path to your admin init

/**
 * Update online presence in Realtime DB
 */
async function setUserOnlineStatus(userId, online = true) {
  const db = admin.database(); // Realtime DB
  const ref = db.ref(`usersPresence/${userId}`);

  await ref.set({
    online,
    lastSeen: Date.now(),
  });
}

module.exports = { setUserOnlineStatus };
