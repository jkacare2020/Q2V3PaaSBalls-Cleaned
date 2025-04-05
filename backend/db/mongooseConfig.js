const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const dbName = process.env.DB_NAME;
    console.log(`Connecting to database: ${dbName}`);

    await mongoose.connect(process.env.MONGODB_URL, {
      dbName, // ✅ This forces the DB name correctly
    });

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
