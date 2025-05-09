// controllers/invoiceController.js
const PDFDocument = require("pdfkit");
const Transact = require("../models/transactModel");

exports.generateInvoice = async (req, res) => {
  try {
    const { userId } = req.body;

    const transactions = await Transact.find({
      owner: userId,
      tran_status: "unpaid",
    });

    if (!transactions || transactions.length === 0) {
      return res.status(404).send("No unpaid transactions found for this user");
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    doc.pipe(res);

    doc.fontSize(20).text("Invoice Summary", { align: "center" });
    doc.moveDown();

    let total = 0;
    transactions.forEach((t, index) => {
      const itemTotal =
        (t.transact_amount || 0) * (parseInt(t.quantity || 1) || 1);
      total += itemTotal;

      doc
        .fontSize(12)
        .text(`Item ${index + 1}`)
        .text(`Product: ${t.description || "N/A"}`)
        .text(`Quantity: ${t.quantity}`)
        .text(`Unit Price: $${t.transact_amount.toFixed(2)}`)
        .text(`Subtotal: $${itemTotal.toFixed(2)}`)
        .moveDown();
    });

    doc.fontSize(14).text(`Total Due: $${total.toFixed(2)}`, {
      align: "right",
    });

    doc.end();
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).send("Could not generate invoice");
  }
};
