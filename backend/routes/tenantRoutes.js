const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");

// Create a new tenant
router.post("/tenants/add", tenantController.createTenant);

// Get a single tenant by ID
router.get("/tenants/:id", tenantController.getTenant);

// Get all tenants
router.get("/tenants", tenantController.getAllTenants);

// Update a tenant by ID
router.put("/tenants/:id", tenantController.updateTenant);

// Delete a tenant by ID
router.delete("/tenants/:id", tenantController.deleteTenant);

module.exports = router;
