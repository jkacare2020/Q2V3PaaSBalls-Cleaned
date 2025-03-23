const mongoose = require("mongoose");
const Counter = require("./Counter");
require("dotenv").config();
console.log("MongoDB URL:", process.env.MONGODB_URL);

async function initializeCounters() {
  try {
    const counters = [
      { seq_name: "transact_number", seq_value: 6000000 },
      { seq_name: "user_number", seq_value: 5000000 },
      { seq_name: "tenant_number", seq_value: 4000000 },
    ];

    for (const counter of counters) {
      const existingCounter = await Counter.findOne({
        seq_name: counter.seq_name,
      });
      if (!existingCounter) {
        await Counter.create(counter);
        console.log(
          `Initialized counter: ${counter.seq_name} with value ${counter.seq_value}`
        );
      } else {
        console.log(`Counter ${counter.seq_name} already exists.`);
      }
    }
  } catch (error) {
    console.error("Error initializing counters:", error);
  } finally {
    mongoose.connection.close();
  }
}

mongoose
  .connect(process.env.MONGODB_URL, { dbName: process.env.DB_NAME })
  .then(() => {
    console.log("Connected to MongoDB");
  });
initializeCounters();
