// backend/server.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/mongooseConfig"); // Adjust the path as needed
const admin = require("./config/firebaseAdmin"); // Initialized Firebase Admin
const userRoutes = require("./routes/userRoutes"); // Import user routes
const transactRoutes = require("./routes/transactRoutes"); // Import user routes
// Import other routes as needed, e.g., transactRoutes, imageProcessingRoutes
const postRoutes = require("./routes/postRoutes");
const videoRoutes = require("./routes/videoRoutes");
const audioRoutes = require("./routes/audioRoutes");
const chatBotRoutes = require("./routes/chatBotRoutes");

dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// CORS Configuration
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        // "https://guasar-jason2024.web.app",
        "http://localhost:9000",
        // Add production URLs here
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type, Authorization",
  })
);
// Example: Check Firebase connectivity
admin
  .auth()
  .listUsers(1)
  .then(() => {
    console.log("Firebase Admin is connected and working.");
  })
  .catch((error) => {
    console.error("Error connecting Firebase Admin:", error);
  });

// Middleware to parse JSON bodies (if needed)
// app.use(express.json());
// Increase the payload size limit (e.g., 10MB)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Mount Routes
app.use("/api", userRoutes); // Mount user routes under /api
app.use("/api", transactRoutes); // Uncomment if you have transact routes
app.use("/api", postRoutes);
app.use("/api", videoRoutes);
app.use("/api", audioRoutes); // Mount STT routes under /api
app.use("/api/chatbot", chatBotRoutes);
// app.use("/api/image-process", imageProcessingRoutes); // Uncomment if you have image processing routes

// Define other routes here if needed, e.g., app.get("/posts", ...), app.post("/createPost", ...), etc.

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
