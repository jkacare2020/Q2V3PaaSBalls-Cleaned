from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from .auth import get_current_user
from config import MONGO_URI
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/ai/hr", tags=["Job Description Upload"])

client = AsyncIOMotorClient(MONGO_URI)
db = client["Q2V3-API"]
job_description_collection = db["jobDescriptions"]

@router.post("/job-description-upload")
async def upload_job_description(
    title: str = Form(...),
    company: str = Form(...),
    job_file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    job_doc = {
        "title": title,
        "company": company,
        "uploadedBy": user["id"],
        "fileUrl": f"/uploads/{job_file.filename}",
        "uploadedAt": datetime.utcnow()
    }

    result = await job_description_collection.insert_one(job_doc)

    return {
        "message": "📄 Job Description uploaded successfully",
        "job_description_id": str(result.inserted_id)
    }

