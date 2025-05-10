//-transactController.js---MongoDB Transactions Admin--------------------
const Transact = require("../models/transacts/Transacts");
// const admin = require("firebase-admin");

const PDFDocument = require("pdfkit");
const getEffectiveTaxRate = require("../utils/getEffectiveTaxRate");

const admin = require("../config/firebaseAdmin"); // Adjust the path as needed
const db = admin.firestore(); // Initialize Firestore instance

const isAdmin = async (userId) => {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return false;

    const userData = userDoc.data();
    const roles = userData.role;

    return Array.isArray(roles) && roles.includes("admin");
  } catch (err) {
    console.error("Error checking admin role:", err);
    return false;
  }
};

// Controller for fetching All Transactions by Role --
exports.getAllTransactions = async (req, res) => {
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

  try {
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required." });
    }

    const transacts = await Transact.find().sort({
      req_date: -1,
      transact_number: -1,
    });

    res.status(200).json(transacts);
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    res.status(500).json({ message: "Error fetching all transactions." });
  }
};

// Controller for fetching transactions by Phone --
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
    query.owner = userId; // Restrict to transactions owned by the user
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
      // return res.status(404).json({ message: "No transactions found" });
      return res.status(200).json(transacts);
    }
    res.json(transacts);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
};

// Controller for fetching transactions by Logged-in UID--
exports.getMyTransactions = async (req, res) => {
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

  try {
    const transacts = await Transact.find({ owner: userId }).sort({
      req_date: -1,
      transact_number: -1,
    });
    if (transacts.length === 0) {
      return res.status(200).json({
        message: "No transactions found for this user.",
        transacts: [],
      });
    }
    res.status(200).json(transacts);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
};

//------------fetch Transaction by Id for Update -----------
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

//--------- Get latest transaction history of a user ----
exports.getTransactionHistoryByPhone = async (req, res) => {
  const { phoneNo } = req.params;
  // const { uid } = req.user; // Verify the logged-in user's identity

  try {
    // Fetch transactions for the provided phone number
    const lastTransaction = await Transact.findOne({
      Phone_Number: phoneNo,
    }).sort({ req_date: -1 });

    if (!lastTransaction) {
      return res.status(404).json({ message: "No transaction history found." });
    }

    res.json({ lastTransaction });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.status(500).json({ message: "Error fetching transaction history." });
  }
};

// ---------------Create a new transaction -----
// ---------------Create a new transaction -----
exports.createNewTransaction = async (req, res) => {
  let {
    userId,
    First_Name,
    Last_Name,
    Phone_Number,
    User_Email,
    Payer_address,
    Payer_address_city,
    Payer_address_state,
    check_type,
    transact_amount,
    tran_status,
    quantity,
    timestamp,
    _id,
    sellerId, // ✅ Add this
    productId, // ✅ Add this (optional but recommended)
    imageUrl, // ✅ Add if used
    description, // Optional, if passed separately
  } = req.body;

  // Ensure _id is not passed to the database
  if (_id) {
    console.warn("Unexpected _id in request payload, removing it.");
    _id = undefined;
  }

  let uid; // Declare uid in the outer scope

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Authorization header missing or invalid." });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    uid = decodedToken.uid; // Assign the Firebase UID to the outer-scope variable
  } catch (error) {
    console.error("Error verifying ID token:", error.message);
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  try {
    const transactionDate = timestamp || new Date();
    const newTransaction = new Transact({
      sellerId, // <- Add this field (must be passed in req.body)
      owner: uid, // Use the uid declared in the outer scope
      userId,
      First_Name,
      Last_Name,
      Phone_Number,
      User_Email,
      Payer_address,
      Payer_address_city,
      Payer_address_state,
      check_type,
      tran_status,
      quantity,
      transact_amount,
      productId, // ✅ Add this (optional but recommended)
      imageUrl, // ✅ Add if used
      description, // Optional, if passed separately
      date: transactionDate,
    });
    console.log(newTransaction);
    await newTransaction.save();
    res.status(201).json({ success: true, transaction: newTransaction });
  } catch (error) {
    console.error("Error saving transaction:", error.message);
    res.status(500).json({ message: "Error saving transaction." });
  }
};

//--------------------------Update Transaction Button clicked----------------
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

exports.deleteTransaction = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const deletedTransaction = await Transact.findByIdAndDelete(id);

    if (!deletedTransaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "Transaction deleted successfully." });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Error deleting transaction." });
  }
};
//---------------------------------Seller---------------------
exports.getTransactionsBySeller = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const sellerId = decoded.uid;

    const sellerTransactions = await Transact.find({ sellerId }).sort({
      req_date: -1,
    });

    return res.status(200).json(sellerTransactions);
  } catch (error) {
    console.error("Error fetching seller transactions:", error.message);
    res.status(500).json({ message: "Failed to fetch seller transactions" });
  }
};

// backend/controllers/transactController.js
exports.getUnpaidTransactions = async (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  const decoded = await admin.auth().verifyIdToken(token);
  const userId = decoded.uid;

  const unpaid = await Transact.find({ owner: userId, tran_status: "unpaid" });
  res.status(200).json(unpaid);
};
//------------------------------------------------------------------------

const fs = require("fs");
const path = require("path");

// exports.generateInvoice = async (req, res) => {
//   try {
//     const { transactId } = req.params;
//     const transact = await Transact.findById(transactId);
//     if (!transact) return res.status(404).send("Transaction not found");

//     const doc = new PDFDocument({ margin: 50 });
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
//     doc.pipe(res);

//     // Optional: Add platform logo
//     const logoPath = path.join(__dirname, "../assets/logo.png");
//     if (fs.existsSync(logoPath)) {
//       doc.image(logoPath, 50, 45, { width: 100 });
//     }

//     doc.fontSize(20).text("INVOICE", 275, 50, { align: "right" }).moveDown();

//     // Buyer and Seller Info
//     doc
//       .fontSize(10)
//       .text(`Invoice Number: ${transact.transact_number}`, { align: "right" })
//       .text(`Date: ${new Date(transact.req_date).toLocaleDateString()}`, {
//         align: "right",
//       })
//       .moveDown();

//     doc.font("Helvetica-Bold").text("Bill To:", 50).font("Helvetica");
//     doc.text(`${transact.First_Name} ${transact.Last_Name}`);
//     doc.text(`${transact.Phone_Number}`);
//     doc.text(`${transact.User_Email}`);
//     doc.moveDown();

//     doc.font("Helvetica-Bold").text("Seller Info:", 50).font("Helvetica");
//     doc.text(`Seller UID: ${transact.sellerId}`);
//     doc.moveDown();

//     // ----------------Table header --------------
//     const tableTop = doc.y;

//     // Table Header
//     doc
//       .font("Helvetica-Bold")
//       .text("Description", 50, tableTop)
//       .text("Qty", 250, tableTop)
//       .text("Unit Price", 300, tableTop)
//       .text("Total", 400, tableTop);
//     doc
//       .moveTo(50, tableTop + 15)
//       .lineTo(550, tableTop + 15)
//       .stroke(); // separator

//     // Table row
//     // Table Row
//     const quantity = parseInt(transact.quantity || "1", 10) || 1;
//     const rowY = tableTop + 25;

//     doc
//       .font("Helvetica")
//       .text(transact.description || "Product/Service", 50, rowY)
//       .text(quantity.toString(), 250, rowY)
//       .text(
//         typeof transact.transact_amount === "number"
//           ? `$${transact.transact_amount.toFixed(2)}`
//           : "$0.00",
//         300,
//         rowY
//       )
//       .text(
//         typeof transact.transact_amount === "number"
//           ? `$${(transact.transact_amount * quantity).toFixed(2)}`
//           : "$0.00",
//         400,
//         rowY
//       );

//     doc.moveDown(2);

//     // 🧠 Compute tax rate based on buyer's city/state
//     const buyerCity = (transact.Payer_address_city || "").trim();
//     const buyerState = (transact.Payer_address_state || "").trim();

//     let taxRate = await getEffectiveTaxRate(
//       transact.sellerId,
//       buyerState,
//       buyerCity
//     );
//     if (typeof taxRate !== "number" || isNaN(taxRate)) {
//       taxRate = 0.0825; // fallback
//     }

//     // const quantity = parseInt(transact.quantity || "1", 10) || 1;
//     const subtotal = transact.transact_amount * quantity;
//     const tax = subtotal * taxRate;
//     const grandTotal = subtotal + tax;

//     // 🧾 Render in PDF
//     doc;
//     doc.moveDown(2);

//     doc
//       .font("Helvetica-Bold")
//       .text(`Subtotal: $${subtotal.toFixed(2)}`, 400)
//       .text(`Tax (${(taxRate * 100).toFixed(2)}%): $${tax.toFixed(2)}`, 400)
//       .text(`Total: $${grandTotal.toFixed(2)}`, 400);

//     doc.end();
//   } catch (error) {
//     console.error("PDF generation error:", error);
//     res.status(500).send("Could not generate invoice");
//   }
// };
