// backend/models/transacts/Transact.js

const mongoose = require("mongoose");
const Counter = require("../counters/Counter"); // Import the Counter model
const { formatPhoneNumber } = require("../../utils/phoneUtils");

const TransactSchema = new mongoose.Schema(
  {
    transact_number: { type: Number, unique: true }, // Auto-incremented transaction number
    transact_amount: { type: Number, required: true },
    req_date: { type: Date, default: Date.now },
    // userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    owner: { type: String, required: true }, // buyer (Firebase UID)
    sellerId: { type: String, required: true }, // seller (product.userId)
    First_Name: { type: String, required: true },
    Last_Name: { type: String, required: true },
    Payer_address: String,
    Payer_address_city: String,
    Payer_address_state: String,
    Payer_address_zip: String,
    Payer_address_country: String,
    Phone_Number: { type: String, required: true },
    User_Email: String,
    tran_status: String,
    description: String,
    check_type: String,
  },
  {
    timestamps: true,
  }
);

TransactSchema.pre("save", function (next) {
  if (this.Phone_Number) {
    this.Phone_Number = formatPhoneNumber(this.Phone_Number);
  }
  next();
});

// Pre-save hook to auto-increment transact_number
TransactSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { seq_name: "transact_number" }, // Find the sequence by name
        { $inc: { seq_value: 1 } }, // Increment the sequence value by 1
        { new: true, upsert: true } // Create if not exists
      );
      this.transact_number = counter.seq_value; // Set the transaction number
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const Transact = mongoose.model("Transact", TransactSchema);
module.exports = Transact;
