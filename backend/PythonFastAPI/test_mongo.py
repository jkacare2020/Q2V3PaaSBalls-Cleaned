import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# ✅ MongoDB Connection
MONGO_URI = "mongodb://127.0.0.1:27017/Q2V3-API"
mongo_client = AsyncIOMotorClient(MONGO_URI)
db = mongo_client["Q2V3-API"]
chatbot_log_collection = db["chatbotlogs"]

# ✅ Async Function to Insert Test Log
async def insert_test_log():
    test_entry = {
        "userId": "test_user",
        "sessionId": f"session-test-{datetime.utcnow().timestamp()}",
        "query": "Manual test insert",
        "response": "Checking MongoDB connection",
        "source": "fastapi",
        "timestamp": datetime.utcnow()
    }

    # ✅ Insert into MongoDB
    result = await chatbot_log_collection.insert_one(test_entry)
    print(f"✅ Inserted Test Document with ID: {result.inserted_id}")

# ✅ Run the async function
asyncio.run(insert_test_log())
