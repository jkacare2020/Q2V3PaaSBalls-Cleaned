import json
import openai
from fastapi import UploadFile, HTTPException
from bson import ObjectId
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import pdfplumber
import pytesseract
from PIL import Image
from docx import Document
from io import BytesIO
from config import MONGO_URI

# ✅ Initialize OpenAI client
client = openai.OpenAI()

# ✅ Initialize MongoDB
mongo_client = AsyncIOMotorClient(MONGO_URI)
db = mongo_client.get_default_database()
resume_collection = db["resumes"]
chatbot_log_collection = db["chatbotlogs"]

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

# ✅ AI Resume Analysis and Scoring
async def analyze_and_score_resume(resume: UploadFile, resume_id: str, user: dict):
    """Analyze resume using AI, score it, and save results to MongoDB."""
    print("🚀 analyze_and_score_resume() STARTED!")

    file_extension = resume.filename.split(".")[-1].lower()
    file_content = await resume.read()

    print(f"📄 File extension: {file_extension}")

    extracted_text = None
    if file_extension == "docx":
        extracted_text = extract_text_from_docx(BytesIO(file_content))
    elif file_extension == "pdf":
        extracted_text = extract_text_from_pdf(BytesIO(file_content))
    elif file_extension in ["jpg", "jpeg", "png"]:
        extracted_text = extract_text_from_image(BytesIO(file_content))
    else:
        print("❌ Unsupported file format")
        raise HTTPException(status_code=400, detail="Unsupported file format")

    print("✅ Extracted text length:", len(extracted_text))

    # ✅ AI-Powered Resume Analysis + Scoring
    prompt = f"""
    You are an AI that reviews resumes and assigns a score from 0-100.
    Return structured JSON with:
    {{
        "years_of_experience": int,
        "matched_skills": ["skill1", "skill2"],
        "certifications": ["cert1", "cert2"],
        "projects": ["project1", "project2"],
        "degree": true or false,
        "resume_score": int,  # ✅ ADD SCORE
        "overall_feedback": "string"
    }}

    Resume Text:
    {extracted_text}
    """

    try:
        print("🚀 Sending request to OpenAI GPT-4...")
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}],
            max_tokens=300
        )

        analysis = response.choices[0].message.content
        analysis_data = json.loads(analysis)

        print("✅ OpenAI response received:", analysis_data)

        # ✅ Ensure `resume_score` is in response
        if "resume_score" not in analysis_data:
            print("❌ Missing resume_score! Setting default value.")
            analysis_data["resume_score"] = 50  # Default Score

        # ✅ Store AI Analysis Result in MongoDB
        log_entry = {
            "resumeId": resume_id,
            "userId": user["id"],
            "query": "Resume Uploaded & Analyzed",
            "response": analysis_data,
            "resume_score": analysis_data["resume_score"],  # ✅ ADD SCORE FIELD
            "source": "resume_analysis",
            "timestamp": datetime.utcnow(),
        }

        # ✅ Save to chatbotlogs
        result = await chatbot_log_collection.insert_one(log_entry)
        if result.inserted_id:
            print(f"✅ Successfully saved chatbot log with ID: {result.inserted_id}")
        else:
            print("❌ Chatbot log insertion failed!")

        return analysis_data  # ✅ Correct return statement

    except Exception as e:
        print(f"❌ AI Processing Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")







