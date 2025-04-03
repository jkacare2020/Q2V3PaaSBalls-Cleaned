# backend/PythonFastAPI/routers/job_semantic_match.py

from fastapi import APIRouter, HTTPException, Depends, Query
from sentence_transformers import SentenceTransformer, util
from bson import ObjectId, errors
from motor.motor_asyncio import AsyncIOMotorClient
from .auth import get_current_user
from config import MONGO_URI
from bson import ObjectId

router = APIRouter(prefix="/semantic-match", tags=["Semantic Matching"])

# Load transformer model
model = SentenceTransformer("all-MiniLM-L6-v2")

# MongoDB setup
client = AsyncIOMotorClient(MONGO_URI)
db = client["Q2V3-API"]
job_collection = db["jobdescriptions"]
chatbot_log_collection = db["chatbotlogs"]

@router.get("/job")
async def semantic_match_job(
    job_id: str = Query(...),
    user: dict = Depends(get_current_user)
):
    if user.get("user_role") not in ["hr_admin", "system", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        job_oid = ObjectId(job_id)
    except errors.InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Job ID format")

    job = await job_collection.find_one({"_id": job_oid})
    if not job:
        print("❌ Job not found in MongoDB")
        raise HTTPException(status_code=404, detail="Job not found")

    job_text = f"{job.get('title', '')}. {job.get('description', '')} {job.get('requiredSkills', '')}"
    job_embedding = model.encode(job_text, convert_to_tensor=True)

    resumes = await chatbot_log_collection.find({"source": "resume_analysis"}).to_list(None)
    if not resumes:
        return {"matches": []}

    user_collection = db["users"]  # ✅ Make sure this is INSIDE the async function

    results = []

    for resume in resumes:
        resume_text = resume.get("response", {}).get("full_text") or resume.get("response", {}).get("raw_text")
        if not resume_text:
            continue

        user_id = resume.get("userId")
        user_info = None
        if user_id:
            try:
                user_info = await user_collection.find_one({"_id": ObjectId(user_id)})
            except Exception as e:
                print(f"⚠️ Failed to fetch user info for userId={user_id}: {e}")

        resume_embedding = model.encode(resume_text, convert_to_tensor=True)
        similarity = util.cos_sim(job_embedding, resume_embedding).item()

        results.append({
            "resume_id": str(resume["_id"]),
            "similarity_score": round(similarity, 4),
            "matched_skills": resume.get("response", {}).get("matched_skills", []),
            "years_of_experience": resume.get("response", {}).get("years_of_experience", "N/A"),
            "candidate_name": resume.get("response", {}).get("full_name", "N/A"),
            "candidate_email": resume.get("response", {}).get("email", "N/A"),
             "candidate_phone": resume.get("response", {}).get("phone", "N/A"),

        })

    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return {"matches": results[:10]}