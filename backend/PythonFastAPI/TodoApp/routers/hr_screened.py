# from fastapi import APIRouter, HTTPException, Depends, Query
# from bson import ObjectId
# from motor.motor_asyncio import AsyncIOMotorClient
# import os
# from datetime import datetime
# from .auth import get_current_user

# router = APIRouter(prefix="/ai/hr", tags=["Screened Resumes"])

# # ✅ Load environment variables
# MONGO_URI = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017/Q2V3-API")
# mongo_client = AsyncIOMotorClient(MONGO_URI)
# db = mongo_client.get_default_database()
# resume_collection = db["resumes"]
# screened_collection = db["screened_resumes"]

# # ✅ Generate a Screened Resume Entry
# @router.post("/resume/screen")
# async def screen_resume(resume_id: str):
#     """Automatically save the resume to the 'screened_resumes' collection after grading"""
#     resume_data = await resume_collection.find_one({"_id": ObjectId(resume_id)})
#     if not resume_data:
#         print("❌ Resume not found, skipping screening")
#         return

#     if "resume_score" not in resume_data:
#         print("❌ Resume not graded yet, skipping screening")
#         return

#     # ✅ Create the screened resume entry
#     screened_resume = {
#         "candidateId": resume_data["candidateId"],
#         "jobId": resume_data["jobId"],
#         "resume_score": resume_data["resume_score"],
#         "top_skills": resume_data.get("matched_skills", []),
#         "experience_years": resume_data.get("years_of_experience", 0),
#         "certifications": resume_data.get("certifications", []),
#         "degree": resume_data.get("degree", False),
#         "ai_feedback": resume_data.get("feedback", ""),
#         "status": "pending",  # ✅ Default status
#         "screened_at": datetime.utcnow()
#     }

#     await screened_collection.insert_one(screened_resume)
#     print(f"✅ Resume screened and saved: {resume_id}")


# @router.get("/resume/screened")
# async def get_screened_resumes(
#     user: dict = Depends(get_current_user),
#     jobId: str = Query(None, description="Filter by Job ID"),
#     min_score: int = Query(0, description="Minimum resume score (0-100)")
# ):
#     if user is None:
#         raise HTTPException(status_code=401, detail="Unauthorized Access")

#     query = {"resume_score": {"$gte": min_score}}
#     if jobId:
#         query["jobId"] = jobId

#     screened_resumes = await screened_collection.find(query).to_list(None)

#     for resume in screened_resumes:
#         resume["_id"] = str(resume["_id"])  # Convert ObjectId to string

#     return screened_resumes
