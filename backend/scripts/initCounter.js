const connectDB = require("../db/mongooseConfig"); // Import the shared connection logic
const Counter = require("../models/counters/Counter"); // Adjust path to your Counter model

(async () => {
  try {
    // Connect to the database
    await connectDB();

    await Counter.deleteOne({ seq_name: "transact_number" });

    // Initialize the counter
    const counter = await Counter.findOneAndUpdate(
      { seq_name: "transact_number" },
      { $setOnInsert: { seq_value: 400000 } },
      { upsert: true, new: true }
    );

    // const updatedCounter = await Counter.findOneAndUpdate(
    //   { seq_name: "transact_number" },
    //   { $inc: { seq_value: 1 } },
    //   { new: true }
    // );
    // console.log("Incremented Counter:", updatedCounter);

    console.log("Counter initialized:", counter);
    process.exit(0); // Exit successfully
  } catch (error) {
    console.error("Error initializing counter:", error);
    process.exit(1); // Exit with error
  }
})();
