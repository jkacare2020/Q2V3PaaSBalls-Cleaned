# ✅ backend/PythonFastAPI/todoApp/utils/resume_analysis_utils.py
import json
from datetime import datetime, timezone
from fastapi import UploadFile, HTTPException
from io import BytesIO
from docx import Document
import pdfplumber
import pytesseract
from PIL import Image
from motor.motor_asyncio import AsyncIOMotorClient
import openai
import os

MONGO_URI = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017/Q2V3-API")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = AsyncIOMotorClient(MONGO_URI)
db = client.get_default_database()
chatbot_log_collection = db["chatbotlogs"]
openai_client = openai.Client(api_key=OPENAI_API_KEY)

def extract_text(file: UploadFile, file_bytes: bytes) -> str:
    ext = file.filename.split(".")[-1].lower()
    if ext == "docx":
        return "\n".join([p.text for p in Document(BytesIO(file_bytes)).paragraphs])
    elif ext == "pdf":
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            return "\n".join([p.extract_text() for p in pdf.pages if p.extract_text() is not None])
    elif ext in ["jpg", "jpeg", "png"]:
        return pytesseract.image_to_string(Image.open(BytesIO(file_bytes)))
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format")


def calculate_resume_score(data):
    experience_score = min(data.get("years_of_experience", 0) * 10, 30)
    skills_score = len(data.get("matched_skills", [])) * 5
    certification_score = len(data.get("certifications", [])) * 10
    project_score = len(data.get("projects", [])) * 5
    education_score = 20 if data.get("degree") else 0
    return min(experience_score + skills_score + certification_score + project_score + education_score, 100)


async def analyze_resume_logic(
    file: UploadFile,
    user: dict,
    job_id: str = None,
    employer_id: str = None
) -> dict:
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    file_bytes = await file.read()
    extracted_text = extract_text(file, file_bytes)

    try:
        ai_response = openai_client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are an AI that reviews resumes. Return structured JSON data with these exact keys: 'full_name', 'email', 'phone', 'years_of_experience', 'matched_skills', 'certifications', 'projects', 'degree', 'overall_feedback'."},
                {"role": "user", "content": f"Resume JSON analysis:\n{extracted_text}"}
            ]
        )
        content = ai_response.choices[0].message.content
        cleaned = content.strip("```json").strip("```").strip()
        analysis_json = json.loads(cleaned)
        analysis_json["raw_text"] = extracted_text

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI analysis failed: {str(e)}")

    log_entry = {
        "userId": user["id"],
        "sessionId": f"session-{user['id']}-{datetime.now(timezone.utc).timestamp()}",
        "query": "Resume Uploaded & Analyzed",
        "response": analysis_json,
        "source": "resume_analysis",
        "timestamp": datetime.now(timezone.utc),
        "jobId": job_id,
        "employerId": employer_id
    }
    result = await chatbot_log_collection.insert_one(log_entry)

    # ✅ Auto-grading logic for employer
    resume_score = calculate_resume_score(analysis_json)
    await chatbot_log_collection.update_one(
        {"_id": result.inserted_id},
        {"$set": {
            "resume_score": resume_score,
            "graded_by": "employer_AI",
            "graded_at": datetime.utcnow()
        }}
    )

    return {
        "resume_id": str(result.inserted_id),
        "analysis": analysis_json,
        "resume_score": resume_score
    }


   