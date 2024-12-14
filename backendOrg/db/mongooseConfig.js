const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const dbName = process.env.DB_NAME; // Extract database name from environment variables
    console.log(`Connecting to database: ${dbName}`);
    await mongoose.connect(process.env.MONGODB_URL, {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
      dbName: process.env.DB_NAME,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process with failure
  }
};

module.exports = connectDB;
