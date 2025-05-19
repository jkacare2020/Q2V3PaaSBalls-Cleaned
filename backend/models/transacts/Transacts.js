const mongoose = require("mongoose");
const Counter = require("../counters/Counter");
const { formatPhoneNumber } = require("../../utils/phoneUtils");

const TransactSchema = new mongoose.Schema(
  {
    transact_number: { type: Number, unique: true },
    transact_amount: { type: Number, required: true },
    req_date: { type: Date, default: Date.now },
    owner: { type: String, required: true }, // buyer (Firebase UID)
    sellerId: { type: String, required: true }, // seller (product.userId)
    sellerUserName: { type: String },
    sellerDisplayName: { type: String },

    // ✅ Add this
    assignedMerchant: { type: String }, // From client.user.assignedMerchant

    First_Name: { type: String, required: true },
    Last_Name: { type: String, required: true },
    Payer_address: String,
    Payer_address_city: String,
    Payer_address_state: String,
    Payer_address_zip: String,
    Payer_address_country: String,
    Phone_Number: { type: String, required: true },
    User_Email: String,
    description: String,
    check_type: String,
    tran_status: { type: String, default: "unpaid" },
    quantity: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

// Format phone number
TransactSchema.pre("save", function (next) {
  if (this.Phone_Number) {
    this.Phone_Number = formatPhoneNumber(this.Phone_Number);
  }
  next();
});

// Auto-increment transact_number
TransactSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { seq_name: "transact_number" },
        { $inc: { seq_value: 1 } },
        { new: true, upsert: true }
      );
      this.transact_number = counter.seq_value;
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
