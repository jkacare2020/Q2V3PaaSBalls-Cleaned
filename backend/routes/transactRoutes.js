const express = require("express");
const router = express.Router();
const {
  getTransactions,
  updateTransaction,
  getTransactionById,
  getTransactionHistoryByPhone,
  createNewTransaction,
  deleteTransaction,
  getAllTransactions,
  getMyTransactions,
  getSellerTransactions,
  getTransactionsBySeller,
  getUnpaidTransactions,
  getDraftTransactions,
} = require("../controllers/transactController");

const invoiceController = require("../controllers/invoiceController");

const authenticateAndAuthorize = require("../middlewares/authMiddleware");

router.get("/transactions/seller", getSellerTransactions);
router.get("/transactions/seller/date", getTransactionsBySeller);

// get transactions routes by user profile phone No. -----------------------
router.get("/mongo-transacts", authenticateAndAuthorize(), getTransactions);

// get transactions routes by user profile role admin-----------------------
router.get(
  "/mongo-AllTransacts",
  // authenticateAndAuthorize(), // isAdmin ? logged in ?---
  getAllTransactions
);

// get my transactions routes by user UID -----------------------
router.get(
  "/mongo-AllMyTransacts",
  // authenticateAndAuthorize(), // isAdmin ? logged in ?---
  getMyTransactions
);

//------------ Create new transaction --------------------------------------
// Get transaction history for a user
router.get(
  "/transactions/history/:phoneNo",
  // authenticateAndAuthorize(),
  getTransactionHistoryByPhone
);

// Create a new transaction
router.post(
  "/transactions/new",
  // authenticateAndAuthorize(),
  createNewTransaction
);

//shopping  cart  : Add route in transactRoutes.js
router.get(
  "/transactions/unpaid",
  authenticateAndAuthorize(),
  getUnpaidTransactions
);

//----------------------------invoiceController--------------------------------
router.get(
  "/transactions/invoice/:transactId",
  // authenticateAndAuthorize(),
  invoiceController.generateInvoiceById
);

// Log transaction ID for debugging
router.get("/transactions/:id", (req, res, next) => {
  console.log(
    "transactRoutes GET request received for transaction ID:",
    req.params.id
  );
  next(); // Pass control to the next middleware or controller
});

router.get("/transactions/drafts", getDraftTransactions);

// Route to get a single transaction by ID url params
router.get("/transactions/:id", authenticateAndAuthorize(), getTransactionById); // This handles the actual logic
// Route to update a single transaction by ID
router.put("/transactions/:id", authenticateAndAuthorize(), updateTransaction);
// DELETE route for deleting a transaction by ID
router.delete(
  "/transactions/:id",
  authenticateAndAuthorize(),
  deleteTransaction
);

module.exports = router;
