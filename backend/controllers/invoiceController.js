//  invoiceController.js //
const PDFDocument = require("pdfkit");
const axios = require("axios");
const Transact = require("../models/transacts/Transacts");

const admin = require("../config/firebaseAdmin");

async function fetchImageBuffer(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return response.data;
  } catch (err) {
    console.warn("⚠️ Failed to fetch avatar:", err.message);
    return null;
  }
}
// 🔍 Helper to fetch avatar image URL from Firestore `posts`
const fetchAvatarUrl = async (userId) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("posts")
      .where("userId", "==", userId)
      .where("tags", "array-contains", "avatar")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return doc.data().imageUrl || null;
    } else {
      console.log("🚫 No avatar found for user:", userId);
      return null;
    }
  } catch (err) {
    console.error("❌ Error fetching avatar URL for", userId, ":", err.message);
    return null;
  }
};

// 📄 Main Controller
exports.generateInvoice = async (req, res) => {
  console.log(
    "📥 Invoice requested for transaction ID:",
    req.params.transactId
  );
  console.log("👤 User making request:", req.user?.uid || req.user);

  try {
    const { userId } = req.body;

    const transactions = await Transact.find({
      owner: userId,
      tran_status: "unpaid",
    });

    if (!transactions || transactions.length === 0) {
      return res.status(404).send("No unpaid transactions found.");
    }

    // Fetch buyer Firestore data
    const buyerDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
    const buyerData = buyerDoc.exists ? buyerDoc.data() : {};

    // Fetch seller Firestore data
    const sellerId = transactions[0].sellerId;
    const sellerDoc = await admin
      .firestore()
      .collection("users")
      .doc(sellerId)
      .get();
    const sellerData = sellerDoc.exists ? sellerDoc.data() : {};

    // 🖼️ Fetch avatar image URLs
    buyerData.avatarUrl = await fetchAvatarUrl(userId);
    console.log("👤 Buyer avatar URL:", buyerData.avatarUrl || "Not found");
    sellerData.avatarUrl = await fetchAvatarUrl(sellerId);
    console.log("👨‍💼 Seller avatar URL:", sellerData.avatarUrl || "Not found");

    // 📄 Start PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    doc.pipe(res);

    // Header
    doc.fontSize(20).text("Ismehr Marketplace Invoice", { align: "center" });
    doc.moveDown();

    // Add avatars
    if (buyerData.avatarUrl) {
      const buyerAvatar = await fetchImageBuffer(buyerData.avatarUrl);
      console.log("✅ Buyer avatar image buffer fetched");
      doc.image(Buffer.from(buyerAvatar), 50, 80, { width: 50 });
    }

    if (sellerData.avatarUrl) {
      const sellerAvatar = await fetchImageBuffer(sellerData.avatarUrl);
      doc.image(Buffer.from(sellerAvatar), 400, 80, { width: 50 });
    }

    // Buyer Info
    doc.fontSize(12).text("Bill To:", 50, 140);
    doc.text(`${buyerData.displayName || buyerData.userName || "N/A"}`);
    doc.text(`${buyerData.companyName || ""}`);
    doc.text(`${buyerData.email || ""}`);
    doc.moveDown();

    // Seller Info
    doc.text("Seller Info:", 400, 140);
    doc.text(`${sellerData.displayName || sellerData.userName || "N/A"}`);
    doc.text(`${sellerData.companyName || ""}`);
    doc.text(`${sellerData.email || ""}`);
    doc.moveDown();

    // Transaction Table
    doc.moveDown().fontSize(14).text("Details", { underline: true });
    let total = 0;

    transactions.forEach((t, index) => {
      const qty = parseInt(t.quantity || 1);
      const itemTotal = (t.transact_amount || 0) * qty;
      total += itemTotal;

      doc
        .fontSize(12)
        .text(`\nItem ${index + 1}`, { continued: false })
        .text(`Product: ${t.description || "N/A"}`)
        .text(`Quantity: ${qty}`)
        .text(`Unit Price: $${t.transact_amount.toFixed(2)}`)
        .text(`Subtotal: $${itemTotal.toFixed(2)}`);
    });

    doc
      .moveDown()
      .fontSize(14)
      .text(`Total Due: $${total.toFixed(2)}`, { align: "right" });

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send("Could not generate invoice");
  }
};

//-----------------------------------------------------------------

const getAvatarUrl = async (userId) => {
  console.log("userId", userId);
  const postsRef = admin.firestore().collection("posts");
  const snapshot = await postsRef
    .where("userId", "==", userId)
    .where("tags", "array-contains", "avatar")
    .orderBy("date", "desc") // 🔄 changed from createdAt to date
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const url = snapshot.docs[0].data().imageUrl || null;
    console.log("✅ Avatar URL found:", url);
    return url;
  }

  console.warn("❌ No avatar found for userId:", userId);
  return null;
};

exports.generateInvoiceById = async (req, res) => {
  const { transactId } = req.params;
  console.log("📥 Invoice requested for transaction ID:", transactId);

  try {
    const transaction = await Transact.findById(transactId);
    if (!transaction) return res.status(404).send("Transaction not found");

    // Fetch avatars
    // const buyerAvatarUrl = await getAvatarUrl(transaction.owner);
    const sellerAvatarUrl = await getAvatarUrl(transaction.sellerId);
    // console.log("🖼 Buyer Avatar:", buyerAvatarUrl);
    console.log("🖼 Seller Avatar:", sellerAvatarUrl);

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${
        transaction.transact_number || transactId
      }.pdf`
    );
    doc.pipe(res);

    // Optional image rendering
    // if (buyerAvatarUrl) {
    //   const buyerBuffer = await fetchImageBuffer(buyerAvatarUrl);
    //   if (buyerBuffer) doc.image(buyerBuffer, 50, 70, { width: 50 });
    // }

    if (sellerAvatarUrl) {
      const sellerBuffer = await fetchImageBuffer(sellerAvatarUrl);
      if (sellerBuffer) doc.image(sellerBuffer, 400, 70, { width: 50 });
    }

    doc.fontSize(18).text("Invoice", { align: "center" }).moveDown();
    doc
      .fontSize(12)
      .text(`Transaction Number: ${transaction.transact_number}`)
      .moveDown();

    // Buyer Info
    doc.text("Bill To:");
    doc.text(`${transaction.First_Name} ${transaction.Last_Name}`);
    doc.text(transaction.User_Email);
    doc.text(transaction.Phone_Number);
    doc.text(
      `${transaction.Payer_address}, ${transaction.Payer_address_city}, ${transaction.Payer_address_state}`
    );
    doc.moveDown();

    // Seller Info
    doc.text("Seller:");
    doc.text(`Display Name: ${transaction.sellerDisplayName || "N/A"}`);
    doc.text(`Username: ${transaction.sellerUserName || "N/A"}`);
    doc.text(`Company name: ${transaction.sellerCompanyName || "N/A"}`);
    doc.moveDown();

    // Product details
    doc.text(`Product: ${transaction.description}`);
    doc.text(`Quantity: ${transaction.quantity || 1}`);
    doc.text(`Unit Price: $${transaction.transact_amount.toFixed(2)}`);
    doc.text(
      `Total: $${(
        transaction.transact_amount * (transaction.quantity || 1)
      ).toFixed(2)}`
    );
    doc.moveDown();

    doc.fontSize(10).text("Thank you for your purchase!", { align: "center" });
    doc.end();
  } catch (error) {
    console.error("Invoice generation error:", error);
    res.status(500).send("Failed to generate invoice");
  }
};
