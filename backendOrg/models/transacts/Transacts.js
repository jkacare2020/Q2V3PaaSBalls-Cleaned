// backend/models/transacts/Transact.js
const mongoose = require("mongoose");

const TransactSchema = new mongoose.Schema({
  transactNumber: String,
  amount: Number,
  date: Date,
  userId: mongoose.Schema.Types.ObjectId, // Linked to a user
  // Other transact-related fields
});

const Transact = mongoose.model("Transact", TransactSchema);
module.exports = Transact;
