# hr_resume.py --
import os
import json
import openai
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from .auth import get_current_user
import pdfplumber
import pytesseract
from PIL import Image
from docx import Document
from io import BytesIO

router = APIRouter(prefix="/ai/hr/resume", tags=["Resume Processing"])

# ✅ Load environment variables
MONGO_URI = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017/Q2V3-API")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ✅ Initialize MongoDB
mongo_client = AsyncIOMotorClient(MONGO_URI)
db = mongo_client.get_default_database()
resume_collection = db["resumes"]
job_collection = db["jobdescriptions"]

# ✅ OpenAI Client
openai.api_key = OPENAI_API_KEY

# ✅ Extract text from DOCX
def extract_text_from_docx(file: BytesIO):
    doc = Document(file)
    return "\n".join([para.text for para in doc.paragraphs])

# ✅ Extract text from PDF
def extract_text_from_pdf(file: BytesIO):
    with pdfplumber.open(file) as pdf:
        return "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])

# ✅ Extract text from Image (JPG, PNG) using OCR
def extract_text_from_image(file: BytesIO):
    image = Image.open(file)
    return pytesseract.image_to_string(image)

# ✅ Resume Analysis and AI Processing
@router.post("/analyze")
async def analyze_resume(
    user: dict = Depends(get_current_user),
    file: UploadFile = File(...)
):
    """Extract text from resume and analyze with GPT-4"""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    file_extension = file.filename.split(".")[-1].lower()
    file_content = await file.read()

    extracted_text = None
    if file_extension == "docx":
        extracted_text = extract_text_from_docx(BytesIO(file_content))
    elif file_extension == "pdf":
        extracted_text = extract_text_from_pdf(BytesIO(file_content))
    elif file_extension in ["jpg", "jpeg", "png"]:
        extracted_text = extract_text_from_image(BytesIO(file_content))
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    # ✅ AI-Powered Resume Analysis
    prompt = f"""
    You are an AI that reviews resumes. Return structured JSON with the following fields:
    {{
        "years_of_experience": int,
        "matched_skills": ["skill1", "skill2"],
        "certifications": ["cert1", "cert2"],
        "projects": ["project1", "project2"],
        "degree": true or false,
        "overall_feedback": "string"
    }}
    
    Resume Text:
    {extracted_text}
    """

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}],
            max_tokens=300
        )

        analysis = json.loads(response["choices"][0]["message"]["content"])
        
        log_entry = {
            "userId": user["id"],
            "sessionId": f"session-{user['id']}-{datetime.now(timezone.utc).timestamp()}",
            "query": "Resume Uploaded & Analyzed",
            "response": analysis,
            "source": "resume_analysis",
            "timestamp": datetime.now(timezone.utc),
        }

        result = await resume_collection.insert_one(log_entry)

        return {
            "analysis": analysis,
            "resume_id": str(result.inserted_id),
            "message": "Resume analysis saved to MongoDB"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI Processing Error: {str(e)}")

# ✅ Resume Scoring Based on Job Description
@router.post("/score")
async def score_resume(
    user: dict = Depends(get_current_user),
    resume_id: str = Query(..., description="MongoDB ID of the analyzed resume")
):
    """Compare resume with job description and assign a score"""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    # ✅ Fetch the resume from MongoDB
    resume_data = await resume_collection.find_one({"_id": ObjectId(resume_id)})
    if not resume_data:
        raise HTTPException(status_code=404, detail="Resume not found")

    # ✅ Fetch the corresponding job description
    job_data = await job_collection.find_one({"_id": ObjectId(resume_data["jobId"])})
    if not job_data:
        raise HTTPException(status_code=404, detail="Job description not found")

    # ✅ AI-Powered Resume Scoring
    prompt = f"""
    Compare the resume against the job description and assign a score (0-100) with feedback.
    
    Job Description:
    {job_data['description']}

    Resume Analysis:
    {json.dumps(resume_data['response'], indent=2)}

    Return JSON format:
    {{
        "score": int,
        "feedback": "string"
    }}
    """

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}],
            max_tokens=250
        )

        analysis = json.loads(response["choices"][0]["message"]["content"])

        # ✅ Store AI Score in MongoDB
        await resume_collection.update_one(
            {"_id": ObjectId(resume_id)},
            {"$set": {
                "resume_score": analysis["score"],
                "feedback": analysis["feedback"],
                "graded_by": user["username"],
                "graded_at": datetime.utcnow()
            }}
        )

        return {"message": "Resume scored successfully", "resume_score": analysis["score"], "feedback": analysis["feedback"]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Scoring Failed: {str(e)}")

# ✅ Retrieve Graded Resumes for Employers
@router.get("/graded-resumes")
async def get_graded_resumes(user: dict = Depends(get_current_user)):
    """Retrieve all resumes graded by AI for employer review"""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    graded_resumes = await resume_collection.find({"resume_score": {"$exists": True}}).to_list(None)

    for resume in graded_resumes:
        resume["_id"] = str(resume["_id"])

    return graded_resumes

# ✅ Route to Fetch Resumes for a Specific Employer
@router.get("/employer-resumes/{employer_id}")
async def get_employer_resumes(
    employer_id: str, user: dict = Depends(get_current_user)
):
    """Retrieve resumes uploaded for a specific employer"""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    resumes = await resume_collection.find({"employerId": employer_id}).to_list(None)

    if not resumes:
        raise HTTPException(status_code=404, detail="No resumes found for this employer.")

    # Convert ObjectId to string for frontend compatibility
    for resume in resumes:
        resume["_id"] = str(resume["_id"])

    return {"resumes": resumes}
