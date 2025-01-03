const admin = require("./firebaseAdmin"); // Import the initialized admin instance

const testFirestoreAccess = async () => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection("users").get();
    snapshot.forEach((doc) => {
      console.log(doc.id, "=>", doc.data());
    });
    console.log("Firestore access is working.");
  } catch (error) {
    console.error("Firestore access failed:", error);
  }
};

testFirestoreAccess();
