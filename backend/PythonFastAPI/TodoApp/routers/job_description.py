# from config import MONGO_URI  # ✅ Now it works!
# from motor.motor_asyncio import AsyncIOMotorClient
# from fastapi import APIRouter, HTTPException, Depends
# from .auth import get_current_user
# from pydantic import BaseModel
# from typing import List, Optional
# from bson import ObjectId
# from fastapi.encoders import jsonable_encoder

# # ✅ Define Pydantic Model
# class JobDescription(BaseModel):
#     title: str
#     company: str
#     description: str
#     requiredSkills: List[str]
#     experienceLevel: str
#     salaryRange: Optional[str] = None
#     location: Optional[str] = None

# class Config:
#         json_schema_extra = {
#             "example": {
#                 "title": "Software Engineer",
#                 "company": "TechCorp",
#                 "description": "Develop and maintain software solutions.",
#                 "requiredSkills": ["Python", "FastAPI", "MongoDB"],
#                 "experienceLevel": "Mid",
#                 "salaryRange": "$80,000 - $100,000",
#                 "location": "Remote",
#             }
#         }

# router = APIRouter(prefix="/ai/hr", tags=["Job Descriptions"])

# client = AsyncIOMotorClient(MONGO_URI)
# db = client["Q2V3-API"]  # ✅ Ensure the database name is correct
# job_collection = db["jobdescriptions"]

# @router.get("/job-descriptions")
# async def get_job_descriptions(user: dict = Depends(get_current_user)):
#     """Retrieve all job descriptions."""
#     if user is None:
#         raise HTTPException(status_code=401, detail="Unauthorized Access")

#     jobs = await job_collection.find().to_list(100)

#     # Convert ObjectId to string
#     for job in jobs:
#         job["_id"] = str(job["_id"])

#     return jsonable_encoder(jobs)  # ✅ Ensure proper encoding

# @router.post("/job-descriptions")
# async def create_job(job: JobDescription, user: dict = Depends(get_current_user)):
#     """Create a new job description with owner information."""
#     if user is None:
#         raise HTTPException(status_code=401, detail="Unauthorized Access")

#     job_dict = job.model_dump()
#     job_dict["createdBy"] = user["id"]  # ✅ Store the employer's user ID
#     result = await job_collection.insert_one(job_dict)

#     return {"message": "Job created successfully", "job_id": str(result.inserted_id)}



# @router.delete("/job-descriptions/{job_id}")
# async def delete_job(job_id: str, user: dict = Depends(get_current_user)):
#     """Delete a job description."""
#     if user is None:
#         raise HTTPException(status_code=401, detail="Unauthorized Access")

#     result = await job_collection.delete_one({"_id": ObjectId(job_id)})

#     if result.deleted_count == 0:
#         raise HTTPException(status_code=404, detail="Job not found")

#     return {"message": "Job deleted successfully"}

# @router.put("/job-descriptions/{job_id}")
# async def update_job(
#     job_id: str, job: JobDescription, user: dict = Depends(get_current_user)
# ):
#     """Update a job description, but only if the current user is the owner."""
#     if user is None:
#         raise HTTPException(status_code=401, detail="Unauthorized Access")

#     # Ensure the job exists and belongs to the user
#     existing_job = await job_collection.find_one({"_id": ObjectId(job_id)})
#     if not existing_job:
#         raise HTTPException(status_code=404, detail="Job not found")

#     if existing_job["createdBy"] != user["id"]:
#         raise HTTPException(status_code=403, detail="You do not have permission to edit this job")

#     result = await job_collection.update_one(
#         {"_id": ObjectId(job_id)}, {"$set": job.model_dump()}
#     )

#     if result.matched_count == 0:
#         raise HTTPException(status_code=404, detail="Job not found")

#     return {"message": "Job updated successfully"}

from config import MONGO_URI  
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import APIRouter, HTTPException, Depends
from .auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Users  # ✅ Import Users model from SQLite

# ✅ Define Pydantic Model
class JobDescription(BaseModel):
    title: str
    company: str
    description: str
    requiredSkills: List[str]
    experienceLevel: str
    salaryRange: Optional[str] = None
    location: Optional[str] = None

class Config:
    json_schema_extra = {
        "example": {
            "title": "Software Engineer",
            "company": "TechCorp",
            "description": "Develop and maintain software solutions.",
            "requiredSkills": ["Python", "FastAPI", "MongoDB"],
            "experienceLevel": "Mid",
            "salaryRange": "$80,000 - $100,000",
            "location": "Remote",
        }
    }

router = APIRouter(prefix="/ai/hr", tags=["Job Descriptions"])

client = AsyncIOMotorClient(MONGO_URI)
db = client["Q2V3-API"]  # ✅ Ensure the database name is correct
job_collection = db["jobdescriptions"]

# ✅ Get DB Session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/job-descriptions")
async def get_job_descriptions(user: dict = Depends(get_current_user)):
    """Retrieve all job descriptions."""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    jobs = await job_collection.find().to_list(100)

    # Convert ObjectId to string
    for job in jobs:
        job["_id"] = str(job["_id"])

    return jsonable_encoder(jobs)  # ✅ Ensure proper encoding

@router.post("/job-descriptions")
async def create_job(
    job: JobDescription, 
    user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)  # ✅ Include SQLite session
):
    """Create a new job description with owner information."""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    # ✅ Fetch Employer's phone number from SQLite `users` table
    employer = db.query(Users).filter(Users.id == user["id"]).first()
    if not employer:
        raise HTTPException(status_code=404, detail="Employer not found")

    job_dict = job.model_dump()
    job_dict["createdBy"] = user["id"]  # ✅ Store the employer's user ID
    job_dict["phone_number"] = employer.phone_number  # ✅ Store employer phone number

    result = await job_collection.insert_one(job_dict)

    return {"message": "Job created successfully", "job_id": str(result.inserted_id)}

@router.delete("/job-descriptions/{job_id}")
async def delete_job(job_id: str, user: dict = Depends(get_current_user)):
    """Allow only the job creator to delete a job description."""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    print(f"🔍 Received job_id for deletion: {job_id}")  # ✅ Debugging

    try:
        obj_id = ObjectId(job_id)  # ✅ Ensure job_id is a valid ObjectId
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Job ID format")  # 🔥 Prevent crashes

    job = await job_collection.find_one({"_id": obj_id})

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # 🔥 Debugging: Check if `createdBy` exists
    print(f"👀 Job Data: {job}")  
    print(f"👤 Current User ID: {user['id']}, Job Creator ID: {job.get('createdBy')}")

    # ✅ Fix: Ensure `createdBy` is an integer and matches the logged-in user
    if str(job.get("createdBy")) != str(user["id"]):
        raise HTTPException(status_code=403, detail="You do not have permission to delete this job")

    result = await job_collection.delete_one({"_id": obj_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    return {"message": "Job deleted successfully"}


@router.put("/job-descriptions/{job_id}")
async def update_job(
    job_id: str, job: JobDescription, user: dict = Depends(get_current_user)
):
    """Update a job description, but only if the current user is the owner."""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    # Ensure the job exists and belongs to the user
    existing_job = await job_collection.find_one({"_id": ObjectId(job_id)})
    if not existing_job:
        raise HTTPException(status_code=404, detail="Job not found")

    if existing_job["createdBy"] != user["id"]:
        raise HTTPException(status_code=403, detail="You do not have permission to edit this job")

    result = await job_collection.update_one(
        {"_id": ObjectId(job_id)}, {"$set": job.model_dump()}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    return {"message": "Job updated successfully"}





