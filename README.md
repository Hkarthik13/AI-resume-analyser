# AI Resume Analyzer

AI Resume Analyzer is a full-stack web app that compares a PDF resume against a job description and gives ATS-focused improvement suggestions.

## Features

- Upload a resume PDF and paste a job description.
- View compatibility score, matched skills, and missing skills.
- Get ATS score boosters, keyword placement guidance, resume modification tips, and project bullet suggestions.
- Download a text draft with resume improvement recommendations.
- Runs locally with fallback ATS analysis by default. Optional Groq LLM analysis can be enabled with `ENABLE_LLM=true`.

## Tech Stack

- Frontend: React, Vite
- Backend: FastAPI, Python
- PDF extraction: PyPDF
- Optional AI: Groq API through LangChain

## Run Locally

Start backend:

```bash
cd backend
venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Start frontend:

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173/
```
