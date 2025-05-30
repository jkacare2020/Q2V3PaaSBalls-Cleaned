// controllers/assignClientController.js
const admin = require("firebase-admin");
const db = admin.firestore();

exports.assignClient = async (req, res) => {
  console.log("🟢 assignClient controller triggered");

  const { method, value } = req.body;
  const merchantId = req.user?.uid;

  console.log("📦 Request body:", req.body);
  console.log("👤 Merchant ID:", merchantId);

  if (!method || !value) {
    console.warn("❌ Missing method or value in request body");
    return res.status(400).json({ message: "Missing method or value" });
  }

  try {
    const querySnapshot = await db
      .collection("users")
      .where(method, "==", value)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      console.warn("🔍 Client not found for method:", method, "value:", value);
      return res.status(404).json({ message: "Client not found" });
    }

    const clientDoc = querySnapshot.docs[0];
    const clientId = clientDoc.id;
    const clientData = clientDoc.data();

    if (clientId === merchantId) {
      return res.status(400).json({ message: "Cannot assign yourself" });
    }

    const clientRef = db.collection("users").doc(clientId);
    const merchantRef = db.collection("users").doc(merchantId);

    // await clientRef.update({ assignedMerchant: merchantId });

    await clientRef.update({
      pendingMerchantInvite: merchantId,
    });

    await merchantRef.set(
      {
        assignedClients: {
          [clientId]: {
            userName: clientData.userName || "",
            phone: clientData.phone || "",
            displayName: clientData.displayName || "",
            assignedAt: new Date(),
          },
        },
      },
      { merge: true }
    );

    console.log("✅ Assignment successful for:", value);
    res.status(200).json({ message: "Client assigned successfully" });
  } catch (err) {
    console.error("🔥 Assignment error:", err);
    res.status(500).json({ message: "Failed to assign client" });
  }
};
//------------------
exports.acceptInvite = async (req, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists)
    return res.status(404).json({ message: "User not found" });

  const userData = userDoc.data();
  const merchantId = userData.pendingMerchantInvite;

  if (!merchantId)
    return res.status(400).json({ message: "No pending invite" });

  await userRef.update({
    assignedMerchant: merchantId,
    pendingMerchantInvite: admin.firestore.FieldValue.delete(),
  });

  res.status(200).json({ message: "Invite accepted" });
};
