// authMiddleware.js
const admin = require("../config/firebaseAdmin"); // Adjust path as needed

const authenticateAndAuthorize = (allowedRoles = []) => {
  return async (req, res, next) => {
    console.log("🔐 Auth middleware hit");
    const authHeader = req.headers.authorization;

    // Check if the Authorization header is present
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: Missing token." });
    }

    const idToken = authHeader.split("Bearer ")[1];

    try {
      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedToken; // Attach to request

      const userRef = admin
        .firestore()
        .collection("users")
        .doc(decodedToken.uid);
      const doc = await userRef.get();

      if (!doc.exists) {
        return res.status(403).json({ message: "Forbidden: User not found." });
      }

      const roleData = doc.data().role;
      const userRoles = Array.isArray(roleData) ? roleData : [roleData]; // normalize from Firestore
      const userIsAdmin = userRoles.includes("admin");

      // ✅ If route only allows admins and user is not admin → block
      if (
        allowedRoles.length === 1 &&
        allowedRoles[0] === "admin" &&
        !userIsAdmin
      ) {
        return res
          .status(403)
          .json({ message: "Forbidden: Admin access required." });
      }

      // ✅ For non-admin routes: allow if any role matches or if admin
      if (
        allowedRoles.length > 0 &&
        !userIsAdmin &&
        !allowedRoles.some((role) => userRoles.includes(role))
      ) {
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient role." });
      }

      // ✅ All checks passed
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(401).json({ message: "Unauthorized: Invalid token." });
    }
  };
};

module.exports = authenticateAndAuthorize;
