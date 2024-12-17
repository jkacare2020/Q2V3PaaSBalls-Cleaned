// backend/models/counters/Counter.js
const mongoose = require("mongoose");

const CounterSchema = new mongoose.Schema({
  seq_name: { type: String, required: true, unique: true }, // Name of the sequence
  seq_value: { type: Number, default: 0 }, // Current value of the sequence
});

const Counter = mongoose.model("Counter", CounterSchema);
module.exports = Counter;
