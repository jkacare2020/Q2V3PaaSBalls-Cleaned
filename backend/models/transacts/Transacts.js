// backend/models/transacts/Transact.js
const mongoose = require("mongoose");

const TransactSchema = new mongoose.Schema({
  transact_number: String,
  transact_amount: { Number, required: true },
  date: Date,
  userId: mongoose.Schema.Types.ObjectId, // Linked to a user
  First_Name: String,
  Last_Name: String,
  Payer_address: String,
  Payer_address_city: String,
  Payer_address_state: String,
  Payer_address_zip: String,
  Payer_address_country: String, // Add this field
  Phone_Number: String,
  description: String, // Add other fields you want to update
});

const Transact = mongoose.model("Transact", TransactSchema);
module.exports = Transact;
