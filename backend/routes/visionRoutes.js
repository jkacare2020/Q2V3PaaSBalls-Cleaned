// backend/routes/visionRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const {
  compareImagesWithAI,
  detectBrandAndMaterial,
  mapProductsToBag,
  mapPriceEstimating,
} = require("../controllers/visionController");

// POST /api/vision/compare
router.post(
  "/compare",
  upload.fields([
    { name: "dirty", maxCount: 1 },
    { name: "cleaned", maxCount: 1 },
  ]),
  compareImagesWithAI
);

// POST /api/vision/detect-brand-material
router.post(
  "/detect-brand-material",
  upload.single("image"),
  detectBrandAndMaterial
);

// POST /api/vision/map-products
router.post("/map-products", mapProductsToBag);

router.post("/map-price-estimate", upload.single("image"), mapPriceEstimating);

module.exports = router;
