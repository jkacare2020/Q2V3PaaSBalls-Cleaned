// backend/routes/bioRoutes.js
const express = require("express");
const router = express.Router();
const {
  uploadBioFile,
  getBioFile,
  deleteBioFile,
} = require("../controllers/bioController");
// const { verifyFirebaseToken } = require("../middleware/authMiddleware");

router.post("/upload", uploadBioFile);
router.post("/delete", deleteBioFile);
router.get("/:userId", getBioFile);

module.exports = router;
