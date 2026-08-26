import React, { useState, useRef } from "react";
import "./App.css";

function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file only. Scans and doc files are not supported.");
      return;
    }
    setError(null);
    setResumeFile(file);
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setError("Please select or drag a Resume PDF file first.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please provide a Job Description to match against.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Simulate multi-stage visual loader for premium UX
    const stages = [
      "Extracting text from PDF...",
      "Analyzing skills against job requirements...",
      "Generating final fit score...",
      "Structuring AI analysis suggestions..."
    ];
    
    let stageIndex = 0;
    setLoadingStage(stages[0]);
    const stageInterval = setInterval(() => {
      stageIndex = (stageIndex + 1) % stages.length;
      setLoadingStage(stages[stageIndex]);
    }, 2000);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("job_description", jobDescription);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      clearInterval(stageInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to analyze the resume. Please check the backend connection.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      clearInterval(stageInterval);
      setError(err.message || "An unexpected error occurred. Please make sure the FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Helper for human-readable file sizes
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Radial dash offset calculation
  const circleRadius = 55;
  const circumference = 2 * Math.PI * circleRadius;
  const matchScore = result ? result.match_score : 0;
  const strokeDashoffset = circumference - (matchScore / 100) * circumference;

  // Determine color class for matching progress
  const getScoreColorClass = (score) => {
    if (score >= 75) return "val-success";
    if (score >= 50) return "val-warning";
    return "val-error";
  };

  const resumeDraft = result ? [
    "PROFESSIONAL SUMMARY",
    result.professional_summary,
    "",
    "ATS KEYWORD FIXES",
    ...(result.resume_modifications || []).map((item) => `- ${item}`),
    "",
    "PROJECT BULLETS",
    ...(result.project_bullets || []).map((item) => `- ${item}`),
    "",
    "KEYWORD PLACEMENT",
    ...(result.keyword_placement || []).map((item) => `- ${item}`),
  ].join("\n") : "";

  const downloadResumeDraft = () => {
    const blob = new Blob([resumeDraft], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ats-resume-improvement-draft.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      {/* Background decoration */}
      <div 
        style={{
          position: "absolute",
          top: "-10%",
          right: "5%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 100%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: -1
        }}
      />
      
      {/* Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
          <h1 className="app-title">AI Resume Analyzer</h1>
        </div>
        <p className="app-subtitle">
          Instantly evaluate resumes against job descriptions, identifying key strengths, matched criteria, missing competencies, and scoring compatibility.
        </p>
        <div className="api-badge">
          <span className="status-dot"></span>
          <span>ATS Resume Engine</span>
        </div>
      </header>

      {/* Grid Dashboard */}
      <div className="dashboard-grid">
        
        {/* Left Side: Setup & Inputs */}
        <section className="glass-panel">
          <h2 className="panel-title">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            Upload Resume Details
          </h2>

          <form onSubmit={handleSubmit}>
            {/* File Upload Zone */}
            <div className="form-group">
              <label className="form-label">Resume PDF</label>
              
              {!resumeFile ? (
                <div 
                  className={`upload-zone ${dragging ? "dragging" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept="application/pdf"
                    onChange={handleFileChange}
                  />
                  <div className="upload-icon-wrapper">
                    <svg width="40" height="40" fill="currentColor" viewBox="0 0 24 24" style={{ display: "inline-block" }}>
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                  </div>
                  <h3 className="upload-text">Drag & drop your resume PDF here</h3>
                  <p className="upload-hint">or click to browse local files (PDF only)</p>
                </div>
              ) : (
                <div className="file-card">
                  <div className="file-icon">PDF</div>
                  <div className="file-info">
                    <p className="file-name">{resumeFile.name}</p>
                    <p className="file-size">{formatBytes(resumeFile.size)}</p>
                  </div>
                  <button className="remove-file-btn" type="button" onClick={removeFile} title="Remove File">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Job Description Text Box */}
            <div className="form-group">
              <label className="form-label" htmlFor="jd">Job Description (JD)</label>
              <textarea
                id="jd"
                className="jd-textarea"
                placeholder="Paste the target job description details (responsibilities, required skills, and constraints)..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-banner">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="analyze-btn" 
              disabled={loading || !resumeFile || !jobDescription.trim()}
            >
              {loading ? (
                <>
                  <svg className="spinner-mini" viewBox="0 0 24 24" style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }}>
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="30 30" />
                  </svg>
                  <span>Running Analysis...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l3.582-1.791a8.977 8.977 0 003.818.152L21 21l-.813-5.096a8.986 8.986 0 00-2.316-4.636l-3.235-3.236a2.001 2.001 0 00-2.83 0l-3.235 3.236a8.986 8.986 0 00-2.316 4.636z" />
                  </svg>
                  <span>Analyze Compatibility</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Right Side: Results & Performance dashboard */}
        <section className="glass-panel" style={{ minHeight: "530px" }}>
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Processing Application Data</p>
              <span className="loading-stage">{loadingStage}</span>
            </div>
          ) : result ? (
            <div className="results-container">
              
              <h2 className="panel-title">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2zm0 8H7v-2h10v2z"/>
                </svg>
                AI Matching Assessment
              </h2>

              {/* Radial Meter and details */}
              <div className="results-header-block">
                <div className="radial-progress-wrapper">
                  <svg className="radial-progress-svg">
                    <circle cx="70" cy="70" r={circleRadius} className="radial-circle-bg" />
                    <circle 
                      cx="70" 
                      cy="70" 
                      r={circleRadius} 
                      className={`radial-circle-val ${getScoreColorClass(result.match_score)}`} 
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                    />
                  </svg>
                  <div className="score-text-wrapper">
                    <span className="score-percent">{result.match_score}%</span>
                    <span className="score-label">Match</span>
                  </div>
                </div>

                <div className="score-details">
                  <h3 className="score-heading">
                    {result.match_score >= 75 ? "Excellent Fit" : result.match_score >= 50 ? "Moderate Match" : "Low Alignment"}
                  </h3>
                  <p className="score-tagline">
                    Based on resume semantic keyword overlap, structural relevance, and specific skill matching algorithms.
                  </p>
                </div>
              </div>

              {/* Mock Mode warning */}
              {result.warning && (
                <div className="warning-banner">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{result.warning}</span>
                </div>
              )}

              {/* Skills breakdown */}
              <div className="skills-comparison-grid">
                
                {/* Matched Skills */}
                <div className="skills-box">
                  <h4 className="skills-box-title matched">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Matched Skills ({result.matched_skills.length})
                  </h4>
                  
                  {result.matched_skills.length > 0 ? (
                    <div className="badges-container">
                      {result.matched_skills.map((skill, i) => (
                        <span key={i} className="skill-badge matched">{skill}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="no-skills-msg">No explicitly matching technical skills identified.</p>
                  )}
                </div>

                {/* Missing Skills */}
                <div className="skills-box">
                  <h4 className="skills-box-title missing">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Missing Competencies ({result.missing_skills.length})
                  </h4>

                  {result.missing_skills.length > 0 ? (
                    <div className="badges-container">
                      {result.missing_skills.map((skill, i) => (
                        <span key={i} className="skill-badge missing">{skill}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="no-skills-msg">No major missing technical competencies found.</p>
                  )}
                </div>

              </div>

              {/* Strengths & Recommendations */}
              <div className="qualitative-grid">
                
                {/* Strengths */}
                <div className="qualitative-card">
                  <h4 className="qualitative-card-title strengths">
                    <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Candidate Strengths
                  </h4>
                  <ul className="qualitative-list">
                    {result.strengths.map((str, i) => (
                      <li key={i} className="qualitative-item">{str}</li>
                    ))}
                  </ul>
                </div>

                {/* Suggestions */}
                <div className="qualitative-card">
                  <h4 className="qualitative-card-title suggestions">
                    <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Recommendations
                  </h4>
                  <ul className="qualitative-list">
                    {result.suggestions.map((sug, i) => (
                      <li key={i} className="qualitative-item">{sug}</li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Resume Builder & ATS Improvement Studio */}
              <div className="builder-panel">
                <div className="builder-heading-row">
                  <h3 className="builder-title">
                    <svg fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                    </svg>
                    Professional Resume Builder
                  </h3>
                  <button type="button" className="download-draft-btn" onClick={downloadResumeDraft}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14" />
                    </svg>
                    <span>Download Draft</span>
                  </button>
                </div>

                <div className="summary-box">
                  <span className="section-kicker">Tailored Summary</span>
                  <p>{result.professional_summary}</p>
                </div>

                <div className="builder-grid">
                  <div className="improvement-card priority">
                    <h4>ATS Score Boosters</h4>
                    <ul>
                      {(result.ats_score_boosters || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="improvement-card">
                    <h4>Modify Resume Like This</h4>
                    <ul>
                      {(result.resume_modifications || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="improvement-card">
                    <h4>Project Bullet Examples</h4>
                    <ul>
                      {(result.project_bullets || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="improvement-card">
                    <h4>Keyword Placement</h4>
                    <ul>
                      {(result.keyword_placement || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="action-plan-strip">
                  <h4>Apply Plan</h4>
                  <div className="action-steps">
                    {(result.action_plan || []).map((item, i) => (
                      <div className="action-step" key={i}>
                        <span>{i + 1}</span>
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="empty-state animate-fade-in">
              <div className="empty-state-icon">
                <svg width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ display: "inline-block" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="empty-state-title">Awaiting Job Application Data</h3>
              <p className="empty-state-desc">
                Upload the candidate's Resume (PDF format) and paste the required Job Description on the left, then click Analyze.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default App;

