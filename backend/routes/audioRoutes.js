const express = require("express");
const router = express.Router();
const {
  uploadAudio,
  getAudio,
  getAllAudios,
  deleteAudio,
} = require("../controllers/audioController");

router.post("/audios/upload", uploadAudio);
router.get("/audios/:id", getAudio);
router.get("/audios", getAllAudios);
router.delete("/audios/:id", deleteAudio);

module.exports = router;
