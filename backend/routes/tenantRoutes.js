// -----tenantRoutes -------------------------------------
//---server.js : app.use("/api/tenants", tenantRoutes);
const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const authenticateAndAuthorize = require("../middlewares/authMiddleware");

// Create a new tenant
router.post("/add", tenantController.createTenant);

// Get a single tenant by ID
router.get("/:id", tenantController.getTenant);

// Get all tenants
// router.get("/", tenantController.getAllTenants);
// Get all tenants (admin only)
router.get(
  "/",
  authenticateAndAuthorize(["admin"]),
  tenantController.getAllTenants
);

// Update a tenant by ID
router.put("/:id", tenantController.updateTenant);

// Delete a tenant by ID
router.delete("/:id", tenantController.deleteTenant);

module.exports = router;
