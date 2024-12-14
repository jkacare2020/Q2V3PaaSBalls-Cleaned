//----------------------------MongoDB Transactions Admin--------------------
const Transact = require("../models/transacts/Transacts");
const admin = require("firebase-admin");
const db = admin.firestore(); // Initialize Firestore instance

// Check if a user is an admin
async function isAdmin(userId) {
  try {
    const userRef = db.collection("users").doc(userId); // Firestore instance
    const doc = await userRef.get();
    if (!doc.exists) {
      console.log("User not found in Firestore.");
      return false;
    }
    return doc.data().role === "admin";
  } catch (error) {
    console.error("Failed to check admin status:", error);
    return false;
  }
}

// Controller for fetching transactions
exports.getTransactions = async (req, res) => {
  const { phone } = req.query;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  let userId;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    userId = decodedToken.uid;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const userIsAdmin = await isAdmin(userId); // Check admin status
  let query = {};

  if (!userIsAdmin) {
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    const normalizedPhone = phone.replace(/\D/g, "");
    query.Phone_Number = new RegExp(
      `.*${normalizedPhone.split("").join(".*")}.*`
    );
  } else if (phone) {
    const normalizedPhone = phone.replace(/\D/g, "");
    query.Phone_Number = new RegExp(
      `.*${normalizedPhone.split("").join(".*")}.*`
    );
  }

  try {
    const transacts = await Transact.find(query).sort({
      req_date: -1,
      transact_number: -1,
    });
    if (transacts.length === 0) {
      return res.status(404).json({ message: "No transactions found" });
    }
    res.json(transacts);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
};

exports.getTransactionById = async (req, res) => {
  const { id } = req.params; // Extract the transaction ID from the URL
  console.log(
    "Controller GET /transactions/:id triggered with _id:",
    req.params.id
  );

  try {
    const transaction = await Transact.findById(id); // Use Mongoose to find by ID
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ message: "Error fetching transaction" });
  }
};

// exports.updateTransaction = async (req, res) => {
//   const { id } = req.params; // Extract `_id` from URL params
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "Unauthorized access" });
//   }

//   const idToken = authHeader.split("Bearer ")[1];
//   let userId;
//   try {
//     const decodedToken = await admin.auth().verifyIdToken(idToken);
//     userId = decodedToken.uid;
//   } catch (error) {
//     console.error("Error verifying ID token:", error);
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }

//   const userIsAdmin = await isAdmin(userId);

//   if (!userIsAdmin) {
//     return res
//       .status(403)
//       .json({ message: "Forbidden: Admin access required" });
//   }

//   try {
//     const updatedData = req.body; // The new transaction data
//     const updatedTransaction = await Transact.findByIdAndUpdate(
//       id,
//       updatedData,
//       { new: true } // Return the updated document
//     );

//     if (!updatedTransaction) {
//       return res.status(404).json({ message: "Transaction not found" });
//     }

//     res.json({
//       message: "Transaction updated successfully",
//       updatedTransaction,
//     });
//   } catch (error) {
//     console.error("Error updating transaction:", error);
//     res.status(500).json({ message: "Error updating transaction" });
//   }
// };
exports.updateTransaction = async (req, res) => {
  const { id } = req.params; // Transaction ID
  let updatedData = req.body; // New transaction data

  console.log("Transaction ID:", id);
  console.log("Payload for Update:", updatedData);

  try {
    // Fetch the existing transaction
    const existingTransaction = await Transact.findById(id);
    if (!existingTransaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    console.log("Existing Transaction:", existingTransaction);

    // Identify modified fields
    const modifiedFields = {};
    for (const key in updatedData) {
      if (updatedData[key] !== existingTransaction[key]) {
        modifiedFields[key] = updatedData[key];
      }
    }

    console.log("Modified Fields:", modifiedFields);

    if (Object.keys(modifiedFields).length === 0) {
      return res
        .status(400)
        .json({ message: "No changes detected for update." });
    }

    // Ensure _id is not included in the update
    if (modifiedFields._id) {
      delete modifiedFields._id;
    }

    // Apply updates using $set
    const updatedTransaction = await Transact.findByIdAndUpdate(
      id,
      { $set: modifiedFields },
      { new: true, runValidators: true }
    );

    console.log("Updated Transaction:", updatedTransaction);

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully.",
      data: updatedTransaction,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "Error updating transaction." });
  }
};
