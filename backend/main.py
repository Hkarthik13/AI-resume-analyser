import os
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env variables relative to the main.py file location
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI(title="AI Resume Analyzer API")

# Add CORS Middleware to allow requests from the React frontend (running on http://localhost:5173 or http://127.0.0.1:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pdf_reader import extract_text


def format_skill(keyword: str):
    display_names = {
        "fastapi": "FastAPI",
        "langchain": "LangChain",
        "postgresql": "PostgreSQL",
        "javascript": "JavaScript",
        "typescript": "TypeScript",
        "nodejs": "Node.js",
        "mongodb": "MongoDB",
        "rag": "RAG",
        "llm": "LLM",
        "pytorch": "PyTorch",
        "aws": "AWS",
        "sql": "SQL",
        "github": "GitHub",
    }
    return display_names.get(keyword, keyword.title())


def build_mock_analysis(resume_text: str, job_description: str, warning: str | None = None):
    jd_lower = job_description.lower()
    resume_lower = resume_text.lower()

    tech_keywords = [
        "python", "react", "fastapi", "langchain", "sql", "postgresql",
        "javascript", "typescript", "docker", "aws", "nodejs", "git", "github", "mongodb",
        "rag", "llm", "pytorch"
    ]
    matched = []
    missing = []

    for kw in tech_keywords:
        if kw in jd_lower:
            if kw in resume_lower:
                matched.append(format_skill(kw))
            else:
                missing.append(format_skill(kw))

    if not matched and not missing:
        matched = ["Python", "Git"]
        missing = ["FastAPI", "React", "LangChain"]

    score = int((len(matched) / (len(matched) + len(missing))) * 100) if (len(matched) + len(missing)) > 0 else 60

    top_matched = matched[:4] or ["software development", "application workflows"]
    top_missing = missing[:4] or ["Job-specific keywords", "Measurable impact", "Project outcomes"]

    analysis = {
        "match_score": min(max(score, 35), 95),
        "matched_skills": matched,
        "missing_skills": missing,
        "strengths": [
            "Clear resume text extraction.",
            "Demonstrates essential software development principles."
        ],
        "suggestions": [
            "Tailor your resume keywords to align closer with the job description.",
            "Add dynamic projects that showcase LangChain and FastAPI tools."
        ],
        "ats_score_boosters": [
            "Use the exact job-description keywords in Skills, Summary, and Project bullets.",
            "Keep section headings simple: Summary, Skills, Experience, Projects, Education.",
            "Add measurable results with numbers, scale, speed, accuracy, users, revenue, or time saved.",
            "Avoid tables, columns, icons, images, and complex formatting in the final ATS version."
        ],
        "resume_modifications": [
            f"Add missing keyword '{skill}' with a real project or experience bullet." for skill in top_missing
        ],
        "professional_summary": (
            f"Software developer with hands-on experience in {', '.join(top_matched)}. "
            f"Focused on building reliable applications and improving product workflows. "
            f"Seeking roles that need {', '.join(top_missing[:3])}."
        ),
        "project_bullets": [
            f"Built a resume analyzer using {', '.join(top_matched[:3])}, extracting PDF content and matching it against role requirements.",
            f"Improved ATS alignment by mapping job-description keywords such as {', '.join(top_missing[:3])} to resume sections.",
            "Designed a clean analysis dashboard that highlights matched skills, missing skills, strengths, and next-step recommendations."
        ],
        "keyword_placement": [
            "Summary: add the target role name and 3 to 5 core skills from the JD.",
            "Skills: group keywords by category such as Languages, Frameworks, Databases, AI/ML, Tools.",
            "Projects: repeat important keywords naturally inside achievement bullets.",
            "Experience: start bullets with action verbs and include measurable outcomes."
        ],
        "action_plan": [
            "First add the missing skills that you can honestly support with project evidence.",
            "Rewrite weak bullets into achievement bullets using action + tool + result.",
            "Create one ATS-friendly PDF version with plain formatting.",
            "Re-run the analyzer after edits and target a match score above 75%."
        ]
    }
    if warning:
        analysis["warning"] = warning
    return analysis

@app.get("/")
def home():
    return {"message": "AI Resume Analyzer API is running"}

@app.post("/analyze")
async def analyze(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    try:
        # Read file bytes
        contents = await resume.read()
        
        # Extract text from PDF
        resume_text = extract_text(contents)
        if not resume_text.strip():
            raise HTTPException(
                status_code=400, 
                detail="Could not extract text from the PDF file. Ensure the PDF is not empty or scanned without OCR."
            )
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")

    # Retrieve Groq API key. Groq exposes an OpenAI-compatible endpoint, so the
    # existing LangChain OpenAI adapter can be reused with a different base URL.
    api_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    enable_llm = os.getenv("ENABLE_LLM", "false").lower() == "true"
    is_placeholder = not api_key or "your_groq_api_key" in api_key or api_key.strip() == ""
    
    if is_placeholder or not enable_llm:
        return build_mock_analysis(resume_text, job_description)

    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import ChatPromptTemplate
        from pydantic import BaseModel, Field
        from typing import List

        # Define the target structured response using Pydantic
        class AnalysisResult(BaseModel):
            match_score: int = Field(description="Percentage match of the resume against the job description (0 to 100)")
            matched_skills: List[str] = Field(description="Skills present in both the resume and the job description, or skills in the resume that align with the job description")
            missing_skills: List[str] = Field(description="Skills required/recommended by the job description that are missing from the resume")
            strengths: List[str] = Field(description="Key strengths and qualifications of the candidate relevant to the job")
            suggestions: List[str] = Field(description="Actionable recommendations and steps for the candidate to improve their alignment with the job description")
            ats_score_boosters: List[str] = Field(description="ATS-specific improvements that can increase parser compatibility and ranking")
            resume_modifications: List[str] = Field(description="Specific resume edits the candidate should make for this job description")
            professional_summary: str = Field(description="A polished resume summary tailored to the job description")
            project_bullets: List[str] = Field(description="Professional resume bullet examples tailored to the resume and job description")
            keyword_placement: List[str] = Field(description="Where and how to place important keywords in the resume")
            action_plan: List[str] = Field(description="Prioritized steps to improve the resume before applying")

        # Initialize the LLM
        llm = ChatOpenAI(
            model=groq_model,
            temperature=0.2,
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )
        structured_llm = llm.with_structured_output(AnalysisResult)

        # Create instructions prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert technical recruiter and ATS resume strategist. Analyze fit, then give specific professional resume changes that improve ATS alignment without inventing false experience."),
            ("user", "Job Description:\n{job_description}\n\nResume Text:\n{resume_text}")
        ])

        chain = prompt | structured_llm
        result = chain.invoke({
            "job_description": job_description,
            "resume_text": resume_text
        })
        
        # Convert Pydantic object to dict and return
        return result.model_dump()
        
    except Exception as e:
        return build_mock_analysis(resume_text, job_description)
