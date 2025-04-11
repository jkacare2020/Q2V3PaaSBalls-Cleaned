//... userPresenceRoutes.js ........
const express = require("express");
const {
  setUserOnline,
  setUserOffline,
} = require("../controllers/userPresenceController");
const router = express.Router();

router.post("/online", setUserOnline);
router.post("/offline", setUserOffline);

module.exports = router;
