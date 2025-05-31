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
//------------------------------------------------------------------
exports.generateInvoice = async (req, res) => {
  console.log(
    "📥 Invoice requested for transaction ID:",
    req.params.transactId
  );

  // optional: confirm user identity
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

    // Fetch buyer and seller metadata
    const buyerDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
    const buyerData = buyerDoc.exists ? buyerDoc.data() : {};

    const sellerId = transactions[0].sellerId;
    const sellerDoc = await admin
      .firestore()
      .collection("users")
      .doc(sellerId)
      .get();
    const sellerData = sellerDoc.exists ? sellerDoc.data() : {};

    // PDF Setup
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    doc.pipe(res);

    // Header
    doc.fontSize(20).text("Ismehr Marketplace Invoice", { align: "center" });
    doc.moveDown();

    // Add avatars if exist
    const buyerAvatar = buyerData.avatarUrl
      ? await fetchImageBuffer(buyerData.avatarUrl)
      : null;
    const sellerAvatar = sellerData.avatarUrl
      ? await fetchImageBuffer(sellerData.avatarUrl)
      : null;

    if (buyerAvatar) doc.image(buyerAvatar, 50, 80, { width: 50 });
    if (sellerAvatar) doc.image(sellerAvatar, 400, 80, { width: 50 });

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
      .text(`Total Due: $${total.toFixed(2)}`, {
        align: "right",
      });

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send("Could not generate invoice");
  }
};

//-----------------------------------------------------------------

exports.generateInvoiceById = async (req, res) => {
  const { transactId } = req.params;

  console.log(
    "📥 Invoice requested for transaction ID:",
    req.params.transactId
  );

  // optional: confirm user identity
  console.log("👤 User making request:", req.user?.uid || req.user);

  try {
    const transaction = await Transact.findById(transactId);

    if (!transaction) {
      return res.status(404).send("Transaction not found");
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${
        transaction.transact_number || transactId
      }.pdf`
    );
    doc.pipe(res);

    // Title
    doc.fontSize(18).text("Invoice", { align: "center" }).moveDown();
    doc
      .fontSize(12)
      .text(`Transaction Number: ${transaction.transact_number}`)
      .moveDown();

    // Buyer Info
    doc.fontSize(12).text("Bill To:");
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

    console.log("🧾 Description:", transaction.description);
    console.log("🧾 Seller Name:", transaction.sellerDisplayName);
    console.log("🧾 Seller compay Name:", transaction.sellerCompanyName);

    // Transaction Details
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
