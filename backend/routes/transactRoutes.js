const express = require("express");
const router = express.Router();
const {
  getTransactions,
  updateTransaction,
  getTransactionById,
} = require("../controllers/transactController");
const authenticateAndAuthorize = require("../middlewares/authMiddleware");

// Log transaction ID for debugging
router.get("/transactions/:id", (req, res, next) => {
  console.log(
    "transactRoutes GET request received for transaction ID:",
    req.params.id
  );
  next(); // Pass control to the next middleware or controller
});

// Route to get a single transaction by ID
router.get("/transactions/:id", authenticateAndAuthorize(), getTransactionById); // This handles the actual logic
// Route to update a single transaction by ID
router.put("/transactions/:id", authenticateAndAuthorize(), updateTransaction);

// Other routes
router.get("/mongo-transacts", authenticateAndAuthorize(), getTransactions);

module.exports = router;
