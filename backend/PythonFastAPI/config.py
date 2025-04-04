# -- config.py--
import os
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()

# ✅ Retrieve OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

DEEPSEEK_API_KEY=os.getenv("DEEPSEEK_API_KEY")

QWEN_API_KEY=os.getenv("QWEN_API_KEY") 

QW_OPENROUTER_API_KEY=os.getenv("QW_OPENROUTER_API_KEY") 

# ✅ Add MongoDB Connection String
MONGO_URI = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017/Q2V3-API")  # ✅ Default to local MongoDB

# ✅ Print to confirm (optional)
print(f"✅ OpenAI API Key Loaded: {OPENAI_API_KEY[:5]}... (Hidden for security)")


