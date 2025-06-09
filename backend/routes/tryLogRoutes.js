const express = require("express");
const router = express.Router();
const tryLogController = require("../controllers/tryLogController");

// POST /api/try-log
router.post("/", tryLogController.logTry);

module.exports = router;
