const admin = require("firebase-admin");

module.exports = async function trialLimitMiddleware(req, res, next) {
  try {
    const user = req.user; // ✅ Set by your auth middleware
    const userDoc = await admin.firestore().collection("users").doc(user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User profile not found." });
    }

    const data = userDoc.data();
    const trialUsed = data.trialUsed || 0;
    const trialLimit = data.trialLimit ?? 5; // Default to 5 if undefined

    if (trialUsed >= trialLimit) {
      return res.status(403).json({ message: "Trial limit reached. Please upgrade to continue." });
    }

    // ✅ Allow access and inject trial values if needed
    req.trialInfo = { trialUsed, trialLimit };
    next();
  } catch (err) {
    console.error("Trial limit check failed:", err);
    res.status(500).json({ message: "Internal server error during trial check." });
  }
};
