// const mongoose = require("mongoose");
// const dotenv = require("dotenv");

// dotenv.config();

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       // useFindAndModify: false, // Deprecated in Mongoose 6+
//       // useCreateIndex: true, // Deprecated in Mongoose 6+
//     });
//     console.log("MongoDB connected successfully");
//   } catch (error) {
//     console.error("MongoDB connection error:", error);
//     process.exit(1); // Exit process with failure
//   }
// };

// module.exports = connectDB;

const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const dbName = process.env.DB_NAME; // Extract database name from environment variables
    console.log(`Backend Connecting to database: ${dbName}`);
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
