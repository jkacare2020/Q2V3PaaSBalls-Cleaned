# ✅ AI-Powered Resume Grading
@router.post("/grade-resume")
async def grade_resume(
    user: dict = Depends(get_current_user),
    resume_id: str = Query(..., description="MongoDB ID of the candidate's resume")
):
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
    Evaluate this resume against the job description. Assign a score (0-100) and provide feedback.
    
    Job Description:
    {job_data['description']}

    Resume:
    {resume_data['resumeFileUrl']}  # ✅ Ensure this contains parsed text from previous analysis

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

        # ✅ Trigger "Screened Resume" Saving
        await screen_resume(resume_id)

        return {"message": "Resume graded successfully", "resume_score": analysis["score"], "feedback": analysis["feedback"]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Scoring Failed: {str(e)}")

