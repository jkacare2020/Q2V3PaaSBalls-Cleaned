from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .models import Base
from .database import engine




# ✅ Import ALL routers (INCLUDING job_description)
from .routers import auth, todos, admin, users, hr_ai, job_description, resume_upload,hr_resume, hr_screened_resumes    # ✅ Add job_description

app = FastAPI()

# ✅ CORS Settings (Ensure frontend can access FastAPI)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:9000", "http://localhost:9200"],  
  # ✅ Ensure your frontend is listed here
    allow_credentials=True,
    allow_methods=["*"],  # ✅ Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # ✅ Allow all headers
)

# ✅ Ensure Database Models Are Created
Base.metadata.create_all(bind=engine)

@app.get("/healthy")
def health_check():
    return {'status': 'Healthy'}

# ✅ Register ALL Routers
app.include_router(auth.router)
app.include_router(todos.router)
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(hr_ai.router)
app.include_router(job_description.router)  # ✅ This was missing!
app.include_router(resume_upload.router)
app.include_router(hr_resume.router)
app.include_router(hr_screened_resumes.router)  # ✅ Ensure this line exists!
