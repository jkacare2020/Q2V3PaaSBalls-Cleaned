const mongoose = require("mongoose");

const JobDescriptionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true }, // Full job text
  requiredSkills: { type: [String], required: true }, // Array of skills
  experienceLevel: {
    type: String,
    enum: ["Junior", "Mid", "Senior"],
    required: true,
  },
  salaryRange: { type: String }, // Optional
  location: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ✅ Store Employer's User ID
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("JobDescription", JobDescriptionSchema);
