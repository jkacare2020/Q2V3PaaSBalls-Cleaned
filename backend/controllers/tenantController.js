//-- tenantController --//
const Tenant = require("../models/tenants/Tenants");
const admin = require("firebase-admin");

exports.createTenant = async (req, res) => {
  try {
    // Check if the Authorization header exists
    if (!req.headers.authorization) {
      return res.status(401).json({ error: "Authorization header missing." });
    }

    // Extract and verify Firebase ID token
    const token = req.headers.authorization.split("Bearer ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ error: "Invalid Authorization header format." });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email } = decodedToken; // Firebase UID and email
    console.log("Tenant UID", uid); // Correct logging of UID

    // Check if the tenant already exists
    const existingTenant = await Tenant.findOne({ userId: uid });
    if (existingTenant) {
      return res.status(400).json({ message: "Tenant already exists." });
    }

    // Create a new tenant record
    const newTenant = new Tenant({
      userId: uid,
      tenant_email: email,
      First_Name: req.body.First_Name,
      Last_Name: req.body.Last_Name,
      Phone_Number: req.body.Phone_Number,
      tenant_plan: req.body.tenant_plan || "Basic",
      payment_amount: req.body.payment_amount,
      tenant_role: req.body.tenant_role, // 🔥 Required by schema
    });

    await newTenant.save();
    //-----------------------update user role--------
    await admin
      .firestore()
      .collection("users")
      .doc(uid)
      .update({
        role: admin.firestore.FieldValue.arrayUnion(req.body.tenant_role),
        tenantId: newTenant._id.toString(),
      });

    res.status(201).json(newTenant);
  } catch (error) {
    console.error("Error creating tenant:", error);
    res.status(500).json({ error: "Failed to create tenant." });
  }
};

// Get a single tenant by ID
exports.getTenant = async (req, res) => {
  try {
    const { id } = req.params; // Extract ID from route parameters
    console.log(id);
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.status(200).json(tenant); // Respond with the tenant data
  } catch (error) {
    console.error("Error retrieving tenant:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get all tenants
exports.getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find(); // Retrieve all tenants
    res.status(200).json(tenants); // Respond with the tenant list
  } catch (error) {
    console.error("Error retrieving tenants:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update a tenant by ID
exports.updateTenant = async (req, res) => {
  try {
    const { id } = req.params; // Extract ID from route parameters
    const updatedTenant = await Tenant.findByIdAndUpdate(id, req.body, {
      new: true, // Return the updated document
      runValidators: true, // Ensure validation rules are applied
    });
    if (!updatedTenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.status(200).json(updatedTenant); // Respond with the updated tenant
  } catch (error) {
    console.error("Error updating tenant:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete a tenant by ID
exports.deleteTenant = async (req, res) => {
  try {
    const { id } = req.params; // Extract ID from route parameters
    const deletedTenant = await Tenant.findByIdAndDelete(id);
    if (!deletedTenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.status(200).json({ message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
