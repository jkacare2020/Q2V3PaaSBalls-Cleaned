// backend/models/tenants/tenants.js
const mongoose = require("mongoose");
const Counter = require("../counters/Counter"); // Import the Counter model
const { formatPhoneNumber } = require("../../utils/phoneUtils");

const TenantSchema = new mongoose.Schema(
  {
    tenant_number: { type: Number, unique: true }, // Auto-incremented number
    payment_amount: { type: Number, required: true },
    req_date: { type: Date, default: Date.now },
    // userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userId: { type: String, required: true }, // Change to String
    First_Name: { type: String, required: true },
    Last_Name: { type: String, required: true },
    tenant_address: String,
    tenant_address_city: String,
    tenant_address_state: String,
    tenant_address_zip: String,
    merchnat_address_country: String,
    Phone_Number: { type: String, required: true },
    tenant_email: String,
    tenant_plan: String,
    product_description: String,
    payment_method: String,
    tenant_role: { type: String, enum: ["merchant", "buyer"], required: true },
  },
  {
    timestamps: true,
  }
);

TenantSchema.pre("save", function (next) {
  if (this.Phone_Number) {
    this.Phone_Number = formatPhoneNumber(this.Phone_Number);
  }
  next();
});

// Pre-save hook to auto-increment tenant_number
TenantSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { seq_name: "tenant_number" }, // Find the sequence by name
        { $inc: { seq_value: 1 } }, // Increment the sequence value by 1
        { new: true, upsert: true } // Create if not exists
      );
      this.tenant_number = counter.seq_value; // Set the merchnat number
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const Tenant = mongoose.model("Tenant", TenantSchema);
module.exports = Tenant;
