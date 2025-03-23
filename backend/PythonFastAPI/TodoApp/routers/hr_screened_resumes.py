from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from .auth import get_current_user
from config import MONGO_URI
from motor.motor_asyncio import AsyncIOMotorClient

# ✅ Initialize MongoDB Connection
mongo_client = AsyncIOMotorClient(MONGO_URI)
db = mongo_client.get_default_database()
resume_collection = db["resumes"]  # ✅ Define resumes collection
chatbot_log_collection = db["chatbotlogs"]  # ✅ Define chatbot logs collection

router = APIRouter(prefix="/ai/hr", tags=["Screened Resumes"])

@router.get("/resume/screened")
async def get_screened_resumes(
    user: dict = Depends(get_current_user),
    min_score: int = Query(0, description="Minimum resume score filter"),
):
    """Retrieve screened resumes based on AI grading for the logged-in employer."""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    employer_id = str(user["id"])  # ✅ Get employer ID from logged-in user

    print(f"🔎 Fetching resumes for Employer ID: {employer_id}")

    # ✅ Step 1: Find resumeIds linked to this employer
    employer_resumes = await resume_collection.find(
        {"employerId": employer_id}
    ).to_list(None)

    if not employer_resumes:
        print("⚠️ No resumes found for this employer!")
        return {"screened_resumes": []}

    # ✅ Extract only the `resumeId`s from the employer's resumes
    employer_resume_ids = [str(resume["_id"]) for resume in employer_resumes]
    print(f"🔎 Found {len(employer_resume_ids)} resumes for Employer ID {employer_id}")

    # ✅ Step 2: Fetch graded resumes from chatbotlogs based on employer's resumeIds
    screened_resumes = await chatbot_log_collection.find(
        {
            "source": "resume_analysis",
            "resume_score": {"$gte": min_score},
            "resumeId": {"$in": employer_resume_ids}  # ✅ Only fetch resumes for this employer
        }
    ).to_list(None)

    if not screened_resumes:
        print("⚠️ No graded resumes found for this employer!")
        return {"screened_resumes": []}

    # Convert ObjectId to string for frontend compatibility
    for resume in screened_resumes:
        resume["_id"] = str(resume["_id"])

    print(f"✅ Returning {len(screened_resumes)} screened resumes for Employer ID {employer_id}")

    return {"screened_resumes": screened_resumes}



