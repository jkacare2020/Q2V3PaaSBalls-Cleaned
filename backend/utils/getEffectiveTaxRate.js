const taxRates = require("../taxRates.json");
const admin = require("../config/firebaseAdmin");

async function getEffectiveTaxRate(sellerId, state = "", city = "") {
  try {
    const sellerRef = admin.firestore().collection("users").doc(sellerId);
    const sellerDoc = await sellerRef.get();

    if (sellerDoc.exists && sellerDoc.data().taxRate != null) {
      return sellerDoc.data().taxRate;
    }
  } catch (err) {
    console.warn(
      "⚠️ Could not fetch seller tax rate, falling back to geo",
      err.message
    );
  }

  const stateRates = taxRates[state] || {};
  return stateRates[city] || stateRates["default"] || taxRates["default"];
}

module.exports = getEffectiveTaxRate;
