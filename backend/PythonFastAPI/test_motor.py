from motor.motor_asyncio import AsyncIOMotorClient

# Define MongoDB connection
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "Q2V3-API"

try:
    # Create an Async MongoDB client
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    print("✅ Successfully connected to MongoDB!")
    
    # List collections
    async def list_collections():
        collections = await db.list_collection_names()
        print(f"📂 Collections in {DB_NAME}: {collections}")

    import asyncio
    asyncio.run(list_collections())

except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
