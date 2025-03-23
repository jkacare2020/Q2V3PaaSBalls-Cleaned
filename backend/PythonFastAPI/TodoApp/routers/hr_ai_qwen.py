from bson import ObjectId  # Ensure ObjectId is imported properly
import os
from fastapi import APIRouter, HTTPException, Depends, Query, File, UploadFile
import openai
from config import OPENAI_API_KEY ,QWEN_API_KEY, DEEPSEEK_API_KEY, QW_OPENROUTER_API_KEY  # Import all required keys
from .auth import get_current_user
import pdfplumber
import pytesseract
from PIL import Image
from docx import Document
from io import BytesIO
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import json  # Make sure this is imported at top
from typing import List
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any
from fastapi.responses import FileResponse
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
import requests

class ChatLog(BaseModel):
    query: str
    response: Dict[str, Any]  # ✅ Now expects a JSON object
    source: str = "fastapi"

datetime.now(timezone.utc)

# ✅ Load from .env
MONGO_URI = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017/Q2V3-API")  # ✅ Use .env variable
print(f"✅ Using MongoDB URI: {MONGO_URI}")  # Debugging

# ✅ Initialize MongoDB Client
mongo_client = AsyncIOMotorClient(MONGO_URI)
db = mongo_client.get_default_database()  # ✅ Auto-detect DB from URI
chatbot_log_collection = db["chatbotlogs"]  # ✅ Use correct collection name

# ✅ OpenAI Client
openai_client = openai.Client(api_key=QW_OPENROUTER_API_KEY)  # ✅ Rename to avoid conflict

router = APIRouter(prefix="/ai/hr", tags=["AI HR Assistant"])

# ✅ AI Chatbot Endpoint -----------------------------------
# OpenRouter.ai API endpoint
QW_OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"

@router.post("/query")
async def ask_hr_ai(
    user: dict = Depends(get_current_user),  
    query: str = Query(..., description="Ask HR AI Assistant any HR-related question."),
):
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    headers = {
        "Authorization": f"Bearer {QW_OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "qwen/qwen-plus",
        "messages": [
            {"role": "system", "content": "You are an HR assistant AI. Help with HR queries."},
            {"role": "user", "content": query}
        ]
    }

    try:
        response = requests.post(QW_OPENROUTER_ENDPOINT, json=data, headers=headers)
        response.raise_for_status()
        completion = response.json()

        answer = completion["choices"][0]["message"]["content"]

        return {"response": answer}

    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"OpenRouter API Error: {str(e)}")
#--------------------------------------------------------------------------------------------    

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

# ✅ Resume Analysis Endpoint (Now Saves to MongoDB)


import requests  # Make sure you import requests

OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"

@router.post("/analyze-resume")
async def analyze_resume(
    user: dict = Depends(get_current_user),
    file: UploadFile = File(...)
):
    try:
        print("✅ Received request to analyze resume")
        
        if user is None:
            raise HTTPException(status_code=401, detail="Unauthorized Access")

        file_extension = file.filename.split(".")[-1].lower()
        file_content = await file.read()
        
        if file_extension == "docx":
            extracted_text = extract_text_from_docx(BytesIO(file_content))
        elif file_extension == "pdf":
            extracted_text = extract_text_from_pdf(BytesIO(file_content))
        elif file_extension in ["jpg", "jpeg", "png"]:
            extracted_text = extract_text_from_image(BytesIO(file_content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        # Prepare the headers
        headers = {
            "Authorization": f"Bearer {QW_OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        # Prepare the payload structure for OpenRouter
        data = {
            "model": "qwen/qwen-plus",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an AI that reviews resumes. Return structured JSON data with these exact keys: "
                        "'years_of_experience' (integer), 'matched_skills' (array of strings), "
                        "'certifications' (array of strings), 'projects' (array of strings), "
                        "'degree' (boolean), and 'overall_feedback' (string). "
                        "Make sure the response is in JSON format."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Resume JSON analysis:\n{extracted_text}"
                },
            ]
        }

        # Send request to OpenRouter API
        response = requests.post(OPENROUTER_ENDPOINT, json=data, headers=headers)
        response.raise_for_status()
        completion = response.json()

        analysis_content = completion["choices"][0]["message"]["content"]

      # Clean and parse JSON from response
        try:
            cleaned_json = analysis_content.strip("```json").strip("```").strip()
            analysis_json = json.loads(cleaned_json)
            print("✅ Successfully parsed OpenRouter response")
        except json.JSONDecodeError as e:
            print(f"❌ JSON Parsing Error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"JSON parsing error: {str(e)}")

# ✅ Move MongoDB logging here (BEFORE returning the response)
        log_entry = {
    "userId": user["id"],
    "sessionId": f"session-{user['id']}-{datetime.now(timezone.utc).timestamp()}",
    "query": "Resume Uploaded & Analyzed",
    "response": analysis_json,
    "source": "resume_analysis",
    "timestamp": datetime.now(timezone.utc),
        }

        result = await chatbot_log_collection.insert_one(log_entry)

# Now correctly return after saving the log
        return {
    "analysis": analysis_json,
    "resume_id": str(result.inserted_id),
    "message": "Resume analysis saved to MongoDB"
}

# Handle OpenRouter API error separately below
    except requests.RequestException as e:
        print(f"❌ OpenRouter API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OpenRouter API Error: {str(e)}")

    except Exception as e:
        print(f"❌ Critical Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {str(e)}")

    except Exception as e:
        print(f"❌ Critical Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {str(e)}")


# ✅ Chat Log Saving -----------------------------------

@router.post("/logs")
async def log_chat_message(
    user: dict = Depends(get_current_user),
    query: str = Query(..., description="User message/query"),
    response: str = Query(..., description="Chatbot or Resume analysis response"),
    source: str = Query("fastapi", description="Source of the log (fastapi/nodejs)")
):
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    print(f"🔥 [LOG REQUEST] User: {user['id']}, Query: {query}, Response: {response}, Source: {source}")

    # ✅ Skip saving "resume_analysis" twice (handled in `analyze-resume`)
    if source == "resume_analysis":
        print("✅ Skipping duplicate log for resume analysis.")
        return {"message": "Skipped duplicate resume analysis log."}

    try:
        # Convert response to JSON object if necessary
        parsed_response = json.loads(response) if isinstance(response, str) else response

        log_entry = {
            "userId": user["id"],
            "sessionId": f"session-{user['id']}-{datetime.utcnow().timestamp()}",
            "query": query,
            "response": parsed_response,
            "source": source,
            "timestamp": datetime.utcnow(),
        }

        result = await chatbot_log_collection.insert_one(log_entry)
        print(f"✅ [LOG INSERTED] MongoDB Log ID: {result.inserted_id}")

        return {"message": "Chat log saved successfully"}

    except json.JSONDecodeError as e:
        print(f"❌ JSON Parsing Error: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON format in response")





# ✅ Resume Grading Endpoint
@router.post("/grade-resume")
async def grade_resume(
    user: dict = Depends(get_current_user),
    resume_id: str = Query(..., description="MongoDB ID of the analyzed resume")
):
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    resume_data = await chatbot_log_collection.find_one({"_id": ObjectId(resume_id)})
    if not resume_data:
        raise HTTPException(status_code=404, detail="Resume analysis not found")

    # Safely parse and validate the analysis_result
    analysis_result = resume_data.get("response")

    if isinstance(analysis_result, str):
        try:
            analysis_result = json.loads(analysis_result)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"Failed to decode JSON: {str(e)}")
    elif not isinstance(analysis_result, dict):
        raise HTTPException(status_code=500, detail="Invalid format: response is not valid JSON/dict")

    # Scoring Criteria
    def calculate_resume_score(data):
        experience_score = min(data.get("years_of_experience", 0) * 10, 30)
        skills_score = len(data.get("matched_skills", [])) * 5
        certification_score = len(data.get("certifications", [])) * 10
        project_score = len(data.get("projects", [])) * 5
        education_score = 20 if data.get("degree") else 0

        total_score = experience_score + skills_score + certification_score + project_score + education_score
        return min(total_score, 100)

    # Calculate score
    resume_score = calculate_resume_score(analysis_result)

    # Update MongoDB record with the calculated score
    await chatbot_log_collection.update_one(
        {"_id": ObjectId(resume_id)},
        {"$set": {
            "resume_score": resume_score,
            "graded_by": user["username"],
            "graded_at": datetime.utcnow()
        }}
    )

    return {"message": "Resume graded successfully", "resume_score": resume_score}


#----------------------------Retrieve All chat log-----------------------------------------------------------------------
@router.get("/chatlogs", response_model=List[dict])
async def get_chat_logs(user: dict = Depends(get_current_user)):
    """Retrieve all chat logs"""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    chat_logs = await chatbot_log_collection.find({}).to_list(None)

    for log in chat_logs:
        log["_id"] = str(log["_id"])  # Convert ObjectId to string for JSON compatibility

    return chat_logs


#---------------------Update chat log----------------------------------------------------

@router.put("/chatlogs/{log_id}")
async def update_chat_log(log_id: str, updated_data: dict, user: dict = Depends(get_current_user)):
    """Update a specific chat log"""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    result = await chatbot_log_collection.update_one(
        {"_id": ObjectId(log_id)}, {"$set": updated_data}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Chat log not found or no changes made")

    return {"message": "Chat log updated successfully"}

#----------------------Delete Cat log----------------------------------------
@router.delete("/chatlogs/{log_id}")
async def delete_chat_log(log_id: str, user: dict = Depends(get_current_user)):
    """Delete a specific chat log"""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    result = await chatbot_log_collection.delete_one({"_id": ObjectId(log_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chat log not found")

    return {"message": "Chat log deleted successfully"}

#------------------PDF--------------------------------------
# ✅ Function to generate PDF with all necessary fields
def generate_resume_pdf(analysis_data, resume_data):
    user_id = resume_data["userId"]
    pdf_filename = f"resume_analysis_{user_id}.pdf"
    pdf_path = os.path.join("generated_pdfs", pdf_filename)

    os.makedirs("generated_pdfs", exist_ok=True)  # Ensure folder exists

    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # ✅ Add Title
    elements.append(Paragraph("Resume Analysis Report", styles["Title"]))
    elements.append(Spacer(1, 12))

    # ✅ Add Metadata Information
    elements.append(Paragraph(f"<b>Report ID:</b> {resume_data['_id']}", styles["BodyText"]))
    elements.append(Paragraph(f"<b>Source:</b> {resume_data.get('source', 'Unknown')}", styles["BodyText"]))
    elements.append(Paragraph(f"<b>Timestamp:</b> {resume_data.get('timestamp', 'N/A')}", styles["BodyText"]))
    elements.append(Spacer(1, 6))

    # ✅ Add Resume Score & Grading Info
    resume_score = resume_data.get("resume_score", "Not Graded")
    elements.append(Paragraph(f"<b>Resume Score:</b> {resume_score}/100", styles["BodyText"]))

    graded_by = resume_data.get("graded_by", "N/A")
    graded_at = resume_data.get("graded_at", "N/A")

    elements.append(Paragraph(f"<b>Graded By:</b> {graded_by}", styles["BodyText"]))
    elements.append(Paragraph(f"<b>Graded At:</b> {graded_at}", styles["BodyText"]))
    elements.append(Spacer(1, 6))

    # ✅ Years of Experience
    elements.append(Paragraph(f"<b>Years of Experience:</b> {analysis_data['years_of_experience']}", styles["BodyText"]))
    elements.append(Spacer(1, 6))

    # ✅ Skills
    elements.append(Paragraph("<b>Matched Skills:</b>", styles["BodyText"]))
    elements.append(ListFlowable(
        [ListItem(Paragraph(skill, styles["BodyText"])) for skill in analysis_data["matched_skills"]],
        bulletType="bullet"
    ))
    elements.append(Spacer(1, 6))

    # ✅ Certifications
    elements.append(Paragraph("<b>Certifications:</b>", styles["BodyText"]))
    if analysis_data["certifications"]:
        elements.append(ListFlowable(
            [ListItem(Paragraph(cert, styles["BodyText"])) for cert in analysis_data["certifications"]],
            bulletType="bullet"
        ))
    else:
        elements.append(Paragraph("None", styles["BodyText"]))
    elements.append(Spacer(1, 6))

    # ✅ Projects
    elements.append(Paragraph("<b>Projects:</b>", styles["BodyText"]))
    elements.append(ListFlowable(
        [ListItem(Paragraph(proj, styles["BodyText"])) for proj in analysis_data["projects"]],
        bulletType="bullet"
    ))
    elements.append(Spacer(1, 6))

    # ✅ Degree Status
    elements.append(Paragraph(f"<b>Degree:</b> {'Yes' if analysis_data['degree'] else 'No'}", styles["BodyText"]))
    elements.append(Spacer(1, 6))

    # ✅ Overall Feedback
    elements.append(Paragraph("<b>Overall Feedback:</b>", styles["BodyText"]))
    elements.append(Paragraph(analysis_data["overall_feedback"], styles["BodyText"]))

    doc.build(elements)
    return pdf_path

# ✅ Endpoint to Generate & Download PDF
@router.get("/generate-resume-pdf")
async def download_resume_pdf(user: dict = Depends(get_current_user), resume_id: str = Query(..., description="MongoDB ID of the analyzed resume")):
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    resume_data = await chatbot_log_collection.find_one({"_id": ObjectId(resume_id)})
    if not resume_data:
        raise HTTPException(status_code=404, detail="Resume analysis not found")

    analysis_result = resume_data.get("response")

    if isinstance(analysis_result, str):
        try:
            analysis_result = json.loads(analysis_result)  # Convert string to JSON
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse JSON: {str(e)}")

    # ✅ Fetch all necessary data fields
    analysis_result["resume_score"] = resume_data.get("resume_score", "Not Graded")
    analysis_result["source"] = resume_data.get("source", "Unknown")
    analysis_result["timestamp"] = resume_data.get("timestamp", "N/A")
    analysis_result["graded_at"] = resume_data.get("graded_at", "N/A")
    analysis_result["graded_by"] = resume_data.get("graded_by", "N/A")

    pdf_path = generate_resume_pdf(analysis_result, resume_data)

    return FileResponse(pdf_path, filename=os.path.basename(pdf_path), media_type="application/pdf")

#------Shortlist for employer to view ----------------------------------------------
@router.put("/shortlist-candidate/{resume_id}")
async def shortlist_candidate(resume_id: str, user: dict = Depends(get_current_user)):
    """Allow employers to shortlist candidates based on AI score."""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    resume = await chatbot_log_collection.find_one({"_id": ObjectId(resume_id)})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    await chatbot_log_collection.update_one(
        {"_id": ObjectId(resume_id)},
        {"$set": {"shortlisted": True, "shortlisted_by": user["id"], "shortlisted_at": datetime.utcnow()}}
    )

    return {"message": "Candidate shortlisted successfully"}

# ------------Resubmit Resumefor candidate ------------------------
@router.put("/resubmit-resume/{resume_id}")
async def resubmit_resume(
    resume_id: str,
    user: dict = Depends(get_current_user),
    file: UploadFile = File(...)
):
    """Allow candidates to resubmit an improved resume."""
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    existing_resume = await chatbot_log_collection.find_one({"_id": ObjectId(resume_id)})
    if not existing_resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Ensure user is the resume owner
    if existing_resume["candidateId"] != user["id"]:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this resume")

    # Save new resume file
    resume_data = {
        "resumeFileUrl": f"/uploads/{file.filename}",
        "resubmitted_at": datetime.utcnow(),
    }

    await chatbot_log_collection.update_one({"_id": ObjectId(resume_id)}, {"$set": resume_data})

    return {"message": "Resume resubmitted successfully"}






