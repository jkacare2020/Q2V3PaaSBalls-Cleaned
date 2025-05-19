// backend/controllers/registerClientController.js
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const { normalizePhoneNumber } = require("../utils/phoneUtils.js");
const db = getFirestore();

exports.registerClient = async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    displayName,
    companyName,
    userName,
    phoneNo,
  } = req.body;

  const merchantId = req.user.uid;
  console.log("📩 Request body:", req.body);
  console.log("👤 Merchant ID:", merchantId);

  try {
    // Normalize phone number to E.164 using utility
    const phone = normalizePhoneNumber(phoneNo);
    if (!phone) {
      return res.status(400).json({ message: "Invalid phone number format." });
    }

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      phoneNumber: phone,
    });

    const clientId = userRecord.uid;
    const userData = {
      email,
      firstName,
      lastName,
      displayName,
      companyName,
      userName,
      phoneNo: phone,
      role: ["client"],
      assignedMerchant: merchantId,
      registrationDate: new Date(),
    };

    // Save to Firestore
    await db.collection("users").doc(clientId).set(userData);

    res
      .status(201)
      .json({ message: "Client registered and assigned successfully" });
  } catch (err) {
    console.error("Error registering client:", err);
    res
      .status(500)
      .json({ message: "Failed to register client", error: err.message });
  }
};
