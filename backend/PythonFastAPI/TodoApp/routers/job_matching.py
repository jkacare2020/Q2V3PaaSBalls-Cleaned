from fastapi import APIRouter, HTTPException, Depends, Query
from pymongo import MongoClient
from bson import ObjectId
from typing import List
from ..auth import get_current_user
from config import MONGO_DB_URI

router = APIRouter(prefix="/job-matching", tags=["Job Matching"])

# ✅ Connect to MongoDB
client = MongoClient(MONGO_DB_URI)
db = client["Q2V3-API"]
job_collection = db["jobDescriptions"]
resume_collection = db["chatbotlogs"]

# ✅ Match Resumes to Job Description
@router.get("/match")
async def match_resumes(
    job_id: str = Query(..., description="MongoDB Job ID"),
    user: dict = Depends(get_current_user),
):
    if user["user_role"] not in ["hr_admin", "system"]:
        raise HTTPException(status_code=403, detail="Unauthorized: HR Admins Only")

    # ✅ Get Job Details
    job_data = job_collection.find_one({"_id": ObjectId(job_id)})
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")

    required_skills = set(job_data["requiredSkills"])

    # ✅ Retrieve Resumes with Score = 100
    resumes = resume_collection.find({"response.resume_score": 100})
    
    # ✅ Match Logic: Find Resumes with Maximum Skill Match
    best_match = None
    best_score = 0

    for resume in resumes:
        matched_skills = set(resume["response"]["matched_skills"])
        match_score = len(matched_skills & required_skills)

        if match_score > best_score:
            best_match = resume
            best_score = match_score

    if not best_match:
        return {"message": "No suitable match found"}

    return {
        "best_match_id": str(best_match["_id"]),
        "matched_skills": list(matched_skills & required_skills),
        "match_score": best_score,
    }
