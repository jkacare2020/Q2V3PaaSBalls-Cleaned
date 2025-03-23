from fastapi import APIRouter, UploadFile, File, HTTPException
import fitz  # PyMuPDF for PDF parsing
import docx
import pytesseract
from PIL import Image
import openai
import os

router = APIRouter(prefix="/resume", tags=["Resume AI"])

# 🔥 OpenAI API Key (load from env)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ✅ Extract Text from PDF
def extract_text_from_pdf(file):
    doc = fitz.open(stream=file.file.read(), filetype="pdf")
    text = "\n".join([page.get_text("text") for page in doc])
    return text

# ✅ Extract Text from DOCX
def extract_text_from_docx(file):
    doc = docx.Document(file.file)
    return "\n".join([para.text for para in doc.paragraphs])

# ✅ Extract Text from Images (OCR)
def extract_text_from_image(file):
    image = Image.open(file.file)
    return pytesseract.image_to_string(image)

# ✅ AI Analysis of Resume
def analyze_resume(text):
    openai.api_key = OPENAI_API_KEY
    response = openai.ChatCompletion.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are an HR expert analyzing resumes."},
            {"role": "user", "content": f"Analyze this resume:\n{text}"}
        ]
    )
    return response["choices"][0]["message"]["content"]

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith((".pdf", ".docx", ".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="Invalid file format")
    
    # Extract text based on file type
    if file.filename.endswith(".pdf"):
        text = extract_text_from_pdf(file)
    elif file.filename.endswith(".docx"):
        text = extract_text_from_docx(file)
    else:
        text = extract_text_from_image(file)

    if not text.strip():
        raise HTTPException(status_code=400, detail="No readable text found")

    # AI Analysis
    ai_result = analyze_resume(text)

    return {"resume_text": text, "analysis": ai_result}
