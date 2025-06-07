// backend/routes/visionRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const trialLimitMiddleware = require("../middlewares/trialLimitMiddleware");

const {
  compareImagesWithAI,
  detectBrandAndMaterial,
  mapProductsToBag,
  mapPriceEstimating,
  generateVisionReportPDF,
} = require("../controllers/visionController");

// POST /api/vision/compare
router.post(
  "/compare",
  trialLimitMiddleware,
  upload.fields([
    { name: "dirty", maxCount: 1 },
    { name: "cleaned", maxCount: 1 },
  ]),
  compareImagesWithAI
);

// POST /api/vision/detect-brand-material
router.post(
  "/detect-brand-material",
  trialLimitMiddleware,
  upload.single("image"),
  detectBrandAndMaterial
);

// POST /api/vision/map-products
router.post("/map-products", trialLimitMiddleware, mapProductsToBag);

router.post(
  "/map-price-estimate",
  trialLimitMiddleware,
  upload.single("image"),
  mapPriceEstimating
);

// GET /api/vision/report/:sessionId (generate & download PDF)
router.get("/report/:sessionId", trialLimitMiddleware, generateVisionReportPDF);

module.exports = router;
