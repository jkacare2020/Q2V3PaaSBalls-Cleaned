const path = require("path");
const os = require("os");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");
const { GptModel } = require("../models/gptModels/GptModel");
// const sharp = require('sharp'); // Uncomment if using sharp for image processing
// const axios = require('axios'); // Uncomment if making external API calls

// Initialize Firebase Storage Bucket
const bucket = admin.storage().bucket();

/**
 * Handles image processing requests.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const processImage = async (req, res) => {
  const userId = req.user.uid; // Extracted from JWT
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No image file uploaded" });
  }

  try {
    // Optional: Process the image (e.g., resize using sharp)
    // const processedImagePath = path.join(os.tmpdir(), `processed-${file.filename}.png`);
    // await sharp(file.path)
    //   .resize(800) // Example: resize to width of 800px
    //   .toFormat('png')
    //   .toFile(processedImagePath);

    // Upload the original image to Firebase Storage
    const originalImageName = `original-images/${uuidv4()}-${
      file.originalname
    }`;
    await bucket.upload(file.path, {
      destination: originalImageName,
      metadata: {
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        },
      },
    });

    // Generate the public URL for the original image
    const originalImageUrl = `https://firebasestorage.googleapis.com/v0/b/${
      bucket.name
    }/o/${encodeURIComponent(originalImageName)}?alt=media&token=${uuidv4()}`;

    // Optional: Upload the processed image to Firebase Storage
    // const processedImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(processedImageName)}?alt=media&token=${uuidv4()}`;

    // Integrate with GPT model or any other processing (Placeholder)
    // Replace the following block with actual GPT model integration
    const processedData = {
      description: "Sample processed data from GPT model",
      analysis: "This is a placeholder for GPT model output.",
    };

    // Save the processed data to MongoDB
    const gptModelEntry = new GptModel({
      userId,
      originalImageUrl,
      processedData,
    });

    await gptModelEntry.save();

    // Clean up temporary files
    fs.unlinkSync(file.path);
    // fs.unlinkSync(processedImagePath); // Uncomment if using processed image

    res.status(200).json({
      message: "Image processed successfully",
      originalImageUrl,
      processedData,
      // processedImageUrl, // Uncomment if using processed image
    });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
};

module.exports = {
  processImage,
};
