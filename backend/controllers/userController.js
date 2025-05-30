// ---userController.js ----
const User = require("../models/users/User"); // Adjust the path as needed
const admin = require("firebase-admin"); // Firebase Admin SDK

/**
 * Function to check if the user is an admin
 * @param {string} userId - Firebase UID of the user
 * @returns {boolean} - True if the user is an admin, otherwise false
 */
const isAdmin = async (userId) => {
  try {
    const userRef = admin.firestore().collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) {
      console.log("User not found in Firestore.");
      return false;
    }

    const roleField = doc.data().role;
    const roles = Array.isArray(roleField) ? roleField : [roleField]; // ✅ Normalize role
    return roles.includes("admin");
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

/**
 * Controller to fetch all users from MongoDB.
 * Only accessible by admin users.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getAllUsers = async (req, res) => {
  const authHeader = req.headers.authorization;

  // Check if the Authorization header is present
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized access to users." });
  }

  const idToken = authHeader.split("Bearer ")[1];
  // console.log(idToken);

  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Check if the user is an admin
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required." });
    }

    // Fetch users data if the user is an admin
    const users = await User.find().select("-avatar -password -tokens");
    res.json(users);
    console.log("Fetching MongoDB users for admin user.");
  } catch (error) {
    console.error("Error fetching MongoDB users:", error);
    res.status(500).json({ message: "Error fetching users from MongoDB" });
  }
};

module.exports = {
  getAllUsers,
};
