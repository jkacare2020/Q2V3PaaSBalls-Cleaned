const express = require("express");
const router = express.Router();
const {
  uploadAudio,
  getAudio,
  getAllAudios,
  deleteAudio,
} = require("../controllers/audioController");

const authenticate = require("../middlewares/authMiddleware");

router.post("/audios/upload", authenticate(), uploadAudio);
router.get("/audios/:id", authenticate(), getAudio);
router.get("/audios", authenticate(), getAllAudios);
router.delete("/audios/:id", authenticate(), deleteAudio);

module.exports = router;
