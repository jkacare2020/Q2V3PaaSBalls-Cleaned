const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const { compareImagesWithAI } = require("../controllers/visionController");

// POST /api/vision/compare
router.post(
  "/compare",
  upload.fields([
    { name: "dirty", maxCount: 1 },
    { name: "cleaned", maxCount: 1 },
  ]),
  compareImagesWithAI
);

module.exports = router;
