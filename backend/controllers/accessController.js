// accessController.js ----------------------------
const admin = require("../config/firebaseAdmin");

exports.setMerchantPasscode = async (req, res) => {
  const merchantId = req.user.uid;
  const { passcode, expiresAt } = req.body;

  try {
    await admin
      .firestore()
      .collection("merchantAccess")
      .doc(merchantId)
      .set(
        {
          passcode,
          updatedAt: new Date(),
          expiresAt: expiresAt || null,
        },
        { merge: true }
      );

    res.status(200).json({ message: "Passcode saved/updated successfully" });
  } catch (err) {
    console.error("Error saving passcode:", err);
    res.status(500).json({ message: "Failed to save passcode" });
  }
};
