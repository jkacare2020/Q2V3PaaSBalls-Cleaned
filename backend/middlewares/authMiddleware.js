// // backend/middlewares/authMiddleware.js

const admin = require("../config/firebaseAdmin"); // Adjust the path as needed

/**
 * Middleware to authenticate and authorize users based on Firebase JWT and roles.
 * @param {Array} allowedRoles - Array of roles permitted to access the route.
 */
const authenticateAndAuthorize = (allowedRoles = []) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check if the Authorization header is present
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const idToken = authHeader.split("Bearer ")[1];
    req.idToken = idToken; // Attach the token to the request object

    try {
      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedToken; // Attach decoded token to request

      // If no roles are specified, proceed
      if (allowedRoles.length === 0) {
        return next();
      }

      // Check if the user is an admin or has one of the allowed roles
      const userIsAdmin = await isAdmin(req.user.uid);
      if (!userIsAdmin && allowedRoles.includes("admin")) {
        return res
          .status(403)
          .json({ message: "Forbidden: Admin access required." });
      }

      // Further role checks can be implemented here if needed
      // For now, we only check for admin access
      if (allowedRoles.includes("admin") && !userIsAdmin) {
        return res
          .status(403)
          .json({ message: "Forbidden: Admin access required." });
      }

      // If all checks pass, proceed to the next middleware/controller
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(401).json({ message: "Unauthorized: Invalid token." });
    }
  };
};

/**
 * Helper function to check if a user is an admin.
 * @param {String} userId - Firebase UID of the user.
 * @returns {Boolean} - Returns true if the user is an admin, else false.
 */
const isAdmin = async (userId) => {
  try {
    const userRef = admin.firestore().collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) {
      console.log("User not found in Firestore.");
      return false;
    }

    const role = doc.data().role;

    return Array.isArray(role) ? role.includes("admin") : role === "admin";
  } catch (error) {
    console.error("Failed to check admin status:", error);
    return false;
  }
};

module.exports = authenticateAndAuthorize;
