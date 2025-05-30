const admin = require("../config/firebaseAdmin");

// GET roles for a Firebase user
exports.getUserRoles = async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await admin.auth().getUser(uid);
    const roleField = user.customClaims?.role;

    // Normalize to array (support both "admin" or ["admin", "merchant"])
    const roles = Array.isArray(roleField)
      ? roleField
      : roleField
      ? [roleField]
      : [];

    res.status(200).json({ uid, roles });
  } catch (error) {
    console.error("Error getting user roles:", error.message);
    res.status(500).json({ message: "Failed to get roles" });
  }
};

// POST new roles to a Firebase user
exports.setUserRoles = async (req, res) => {
  try {
    const { uid } = req.params;
    const { roles } = req.body;

    if (!Array.isArray(roles)) {
      return res.status(400).json({ message: "Roles must be an array" });
    }

    await admin.auth().setCustomUserClaims(uid, { role: roles });
    res.status(200).json({ message: `Roles updated for user ${uid}`, roles });
  } catch (error) {
    console.error("Error setting user roles:", error.message);
    res.status(500).json({ message: "Failed to set roles" });
  }
};
