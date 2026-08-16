# RecruitX – AI Recruitment Screening Agent

> Hire smarter. Find the right fit, faster.**

##  Overview

RecruitX is an AI-powered recruitment platform that helps recruiters screen, rank, and shortlist candidates based on **job-relevant skills and experience**.

Instead of relying only on keywords or total years of experience, RecruitX evaluates **skill-wise experience, projects, and job requirements** to generate an explainable candidate match score.

It also aims to reduce repetitive recruitment work through automated communication and interview scheduling.

---

##  Key Features

**AI Resume Parsing** – Extract skills, experience, education, projects and certifications.

**Skill-wise Matching** – Compare candidates based on experience in the skills actually required for the job.

**Candidate Ranking** – Automatically rank applicants using a Match Score.

**Explainable Matching** – Show why a candidate is a strong or weak match.

**AI Email Generation** – Generate personalized shortlist and interview emails.

**Interview Scheduling** – Streamline the process of scheduling interviews.

**GitHub Integration** – Allow recruiters to review candidate projects and technical portfolios.

**Bias-aware Screening** – Focus evaluation on job-relevant information and flag potential bias patterns.

---

## Tech Stack

**Frontend:** React.js, React Native

**Backend:** Node.js, Express.js

**Database:** MongoDB

**Qwen 2.5–7B:** AI-powered resume verification & mock test generation
​
**Authentication:** Google SMTP, Email Authentication, 2FA, Phone Verification
 ​
**Interview Automation:** Google Calendar API, Automated Interview Scheduling

**AI Applications:** Resume Verification, Mock Test & Interview Question Generation

 ​
**Architecture:** MERN Stack
​

---

## Technical Workflow

```text
Candidate / Resume
       ↓
AI Resume Parser
       ↓
Structured Candidate Profile
       ↓
Job Requirements
       ↓
AI Matching Engine
       ↓
Skill + Experience + Semantic Matching
       ↓
Match Score
       ↓
Candidate Ranking
       ↓
Shortlist → Email → Interview
```

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/ShirishRay/RecruitX.git
cd RecruitX
```

### 2. Install dependencies

```bash
cd client
npm install

cd ../server
npm install
```

### 3. Configure environment variables

Create a `.env` file in the backend and add your required credentials:

```env
MONGODB_URI=your_mongodb_uri
AI_API_KEY=your_ai_api_key
JWT_SECRET=your_jwt_secret
```

Add any additional Firebase, Google, email, or API credentials required by your implementation.

### 4. Run the project

```bash
# Backend
npm run dev

# Frontend
npm run dev
#Both together
cd RecruitX
npm run dev
---

##  Why RecruitX?

Traditional hiring often focuses on **how many years a candidate has worked**.

RecruitX focuses on:

> **How relevant is that experience to this particular job?**

This helps recruiters discover candidates who are genuinely suited to the role while reducing manual screening effort.

---

## Future Scope

* AI-powered interview assistant
* Advanced skill-gap analysis
* Personalized learning recommendations
* GitHub project intelligence
* Resume improvement suggestions
* Predictive hiring analytics
* Multi-language recruitment support

---


---
