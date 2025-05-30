// controllers/invitationController.js
const admin = require("firebase-admin");
const db = admin.firestore();

exports.acceptInvite = async (req, res) => {
  const uid = req.user?.uid;
  console.log("🔔 Incoming invite acceptance from:", uid);

  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  try {
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log("❌ User not found:", uid);
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();
    const merchantId = userData.pendingMerchantInvite;

    console.log("📦 UserData:", userData);
    console.log("📌 Pending Merchant Invite:", merchantId);

    if (!merchantId) {
      console.log("❌ No pendingMerchantInvite field for user:", uid);
      return res.status(400).json({ message: "No pending invite" });
    }

    await userRef.update({
      assignedMerchant: merchantId,
      pendingMerchantInvite: admin.firestore.FieldValue.delete(),
    });

    console.log("✅ Invite accepted. Assigned merchant:", merchantId);
    res.status(200).json({ message: "Invite accepted" });
  } catch (err) {
    console.error("🔥 Error in acceptInvite:", err);
    res.status(500).json({ message: "Server error during invite acceptance" });
  }
};

exports.getPendingInvite = async (req, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  try {
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists)
      return res.status(404).json({ message: "User not found" });

    const userData = userDoc.data();
    const merchantId = userData.pendingMerchantInvite;

    if (!merchantId) return res.status(200).json({ merchant: null });

    const merchantDoc = await db.collection("users").doc(merchantId).get();
    if (!merchantDoc.exists) return res.status(200).json({ merchant: null });

    res.status(200).json({
      merchant: {
        displayName: merchantDoc.data().displayName || "Unknown",
        merchantId: merchantId,
      },
    });
  } catch (err) {
    console.error("🔥 Error in getPendingInvite:", err);
    res.status(500).json({ message: "Server error during invite fetch" });
  }
};
exports.declineInvite = async (req, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  try {
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists)
      return res.status(404).json({ message: "User not found" });

    const userData = userDoc.data();
    const merchantId = userData.pendingMerchantInvite;

    if (!merchantId)
      return res.status(400).json({ message: "No pending invite to decline" });

    // Remove the pending invite
    await userRef.update({
      pendingMerchantInvite: admin.firestore.FieldValue.delete(),
    });

    res.status(200).json({ message: "Invite declined" });
  } catch (err) {
    console.error("🔥 Error in declineInvite:", err);
    res.status(500).json({ message: "Server error during invite decline" });
  }
};
