//--userPresenceController.js
// const admin = require("../config/firebaseAdmin");
// exports.setUserOnline = async (req, res) => {
//   const { userId } = req.body;
//   try {
//     await admin.database().ref(`usersPresence/${userId}`).set({
//       online: true,
//       lastSeen: Date.now(),
//     });
//     res.send("User marked online");
//   } catch (err) {
//     res.status(500).send("Error updating presence");
//   }
// };

// exports.setUserOffline = async (req, res) => {
//   const { userId } = req.body;
//   try {
//     await admin.database().ref(`usersPresence/${userId}`).update({
//       online: false,
//       lastSeen: Date.now(),
//     });
//     res.send("User marked offline");
//   } catch (err) {
//     res.status(500).send("Error updating presence");
//   }
// };
// backend/controllers/userPresenceController.js
const admin = require("../config/firebaseAdmin");

const setUserOnline = async (userId) => {
  await admin.database().ref(`usersPresence/${userId}`).set({
    online: true,
    lastSeen: Date.now(),
  });
};

const setUserOffline = async (userId) => {
  await admin.database().ref(`usersPresence/${userId}`).update({
    online: false,
    lastSeen: Date.now(),
  });
};

// Export for use in other controllers
module.exports = {
  setUserOnline,
  setUserOffline,
};
