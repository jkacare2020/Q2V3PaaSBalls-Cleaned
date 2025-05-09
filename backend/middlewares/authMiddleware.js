const admin = require("../config/firebaseAdmin"); // Adjust path as needed

/**
 * Middleware to authenticate and authorize users based on Firebase JWT and roles.
 * @param {Array} allowedRoles - Array of roles permitted to access the route.
 */

const authenticateAndAuthorize = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      // const decoded = await admin.auth().verifyIdToken(token);

      // req.user = {
      //   uid: decoded.uid,
      //   role: Array.isArray(decoded.role) ? decoded.role : [],
      // };
      // console.log("Decoded Token Roles:", decoded.role); // <-- add this
      if (
        requiredRoles.length > 0 &&
        !requiredRoles.some((r) => req.user.role.includes(r))
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error.message);
      return res.status(403).json({ message: "Forbidden" });
    }
  };
};

module.exports = authenticateAndAuthorize;
