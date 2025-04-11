// backend/middleware/setPresence.js
const { setUserOnlineStatus } = require("../utils/setUserPresence");

const updatePresence = async (req, res, next) => {
  const userId = req.user?.uid; // user injected after Firebase auth
  if (userId) {
    try {
      await setUserOnlineStatus(userId, true); // ✅ online
    } catch (err) {
      console.error("Error updating presence:", err);
    }
  }
  next();
};

module.exports = updatePresence;
