<div align="center">
  
  # 🛡️ PhishGuard AI

  <p align="center">
    <strong>"Understand Every Email Before You Trust It."</strong>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  </p>
</div>

<br/>

## 📖 Overview

**PhishGuard AI** is a modern, enterprise-grade Email Threat Intelligence Platform. It bridges the gap between raw machine learning risk scores and human understanding. Instead of just flagging an email as "Phishing", PhishGuard AI leverages **Machine Learning** coupled with **Google Gemini Vision** and **Large Language Models** to explain *why* an email is dangerous, in plain English.

Whether you're an enterprise security team analyzing threats or an individual trying to verify an urgent email, PhishGuard AI extracts, parses, and translates the threat into actionable intelligence.

---

## ✨ Key Features (Currently Available)

- 🧠 **AI Threat Detection**: Uses machine learning to detect zero-day phishing attacks, analyzing URLs, urgency keywords, and sender domains.
- 📸 **Screenshot OCR Engine**: Seamlessly drag & drop email screenshots. The application integrates directly with Gemini Vision AI to instantly extract both the Email Subject and Body with extremely high accuracy.
- 💡 **Explainable AI**: Doesn't just give a risk score. The AI highlights the suspicious links, lists exact reasons for the risk, detects social engineering techniques, and recommends the next best action.
- 💬 **SOC Security Assistant**: A fully functional, context-aware Chatbot integrated straight into the dashboard to answer your questions about cybersecurity and your recent email analyses.
- 🔒 **Secure Authentication**: Robust session management and persistence handled by Supabase.
- 🛡️ **Resilient Infrastructure**: Graceful failover and exponential backoff retry mechanisms to ensure the application remains stable even during AI provider rate limits or downtime.
- 🎨 **Modern Glassmorphism UI**: A gorgeous, highly responsive dashboard built with Tailwind CSS, Framer Motion, and Lucide Icons.

---

## 🚀 Upcoming Features (Roadmap)

- [ ] **Phase 3 (EML Uploads):** Direct parsing of raw `.eml` files, extracting routing headers, SPF/DKIM/DMARC records, and embedded attachments.
- [ ] **Phase 4 (PDF & Document Scanning):** Deep malware inspection inside PDFs, ZIPs, and Office documents.
- [ ] **Phase 5 (URL Sandbox Inspection):** Real-time safe-rendering of embedded links to detect spoofed login portals.
- [ ] **Phase 6 (PDF Reporting):** Generate compliance-ready threat intelligence reports.

---

## 🏗️ Architecture

PhishGuard AI is built on a modern decoupled architecture:

* **Frontend:** Built with the latest Next.js 16 (App Router), React, and TypeScript. Uses Tailwind CSS for rapid styling and Framer Motion for micro-animations.
* **Backend:** A highly concurrent FastAPI (Python) backend serving the Machine Learning prediction model and AI orchestrations.
* **Database & Auth:** Supabase (PostgreSQL) handles all user authentication, history tracking, and secure session management.

---

## 💻 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Jaswanth2106/PhishGuard-AI.git
cd PhishGuard-AI
```

### 2. Frontend Setup (Next.js)
```bash
cd frontend
npm install

# Create a .env.local file in the frontend directory with your Supabase & Gemini keys
npm run dev
```
*The frontend will run on `http://localhost:3000`.*

### 3. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv

# Activate Virtual Environment
# Windows:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Run the backend server
python -m uvicorn app.main:app --reload --port 8000
```
*The backend will run on `http://127.0.0.1:8000`.*

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues). 

## 📝 License
This project is [MIT](LICENSE) licensed.
