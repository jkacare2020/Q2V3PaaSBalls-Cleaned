const express = require("express");
const router = express.Router();
const { assignClient } = require("../controllers/assignClientController");
const authenticateAndAuthorize = require("../middlewares/authMiddleware");

router.post("/assign", authenticateAndAuthorize(["merchant"]), assignClient);

module.exports = router;
