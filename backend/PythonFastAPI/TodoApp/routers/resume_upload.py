from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from .auth import get_current_user
from config import MONGO_URI
from motor.motor_asyncio import AsyncIOMotorClient
from .resume_processing import analyze_and_score_resume  # ✅ Import AI processing function

# ✅ Define FastAPI router
router = APIRouter(prefix="/ai/hr", tags=["Resume Upload"])

client = AsyncIOMotorClient(MONGO_URI)
db = client["Q2V3-API"]
resume_collection = db["resumes"]

@router.post("/resume-upload")
async def upload_resume(
    resume: UploadFile = File(...),
    jobId: str = Form(...),
    employerId: str = Form(...),
    user: dict = Depends(get_current_user)
):
    """Upload a resume, analyze it using AI, and store metadata in MongoDB."""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    # ✅ Save resume metadata first
    resume_data = {
        "candidateId": user["id"],
        "jobId": jobId,
        "employerId": employerId,
        "resumeFileUrl": f"/uploads/{resume.filename}",
        "uploadedAt": datetime.utcnow()
    }

    insert_result = await resume_collection.insert_one(resume_data)
    resume_id = str(insert_result.inserted_id)

    # ✅ Call AI-powered analysis function
    try:
        analysis_result = await analyze_and_score_resume(resume, resume_id, user)
        return {
            "message": "Resume uploaded and analyzed successfully",
            "resume_id": resume_id,
            "analysis_result": analysis_result
        }
    except Exception as e:
        return {
            "message": "Resume uploaded, but AI analysis failed",
            "resume_id": resume_id,
            "error": str(e)
        }


