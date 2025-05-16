// routes/accessRoutes.js
const express = require("express");
const router = express.Router();
const { setMerchantPasscode } = require("../controllers/accessController");
const authenticate = require("../middlewares/authMiddleware");

router.post("/set-passcode", authenticate(), setMerchantPasscode);
module.exports = router;
