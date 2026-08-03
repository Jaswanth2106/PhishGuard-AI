# Hackathon Submission: PhishGuard AI

**Track Theme:** Theme 4 - Domain Agents (Cybersecurity applied to email threat classification)

## 🔗 Live Application Links
- **Live Frontend (Vercel):** [https://phishguard-ai-ten-phi.vercel.app](https://phishguard-ai-ten-phi.vercel.app)
- **Live Backend API (Render):** [https://phishguard-backend-33xh.onrender.com](https://phishguard-backend-33xh.onrender.com)
- **GitHub Repository:** [Jaswanth2106/PhishGuard-AI](https://github.com/Jaswanth2106/PhishGuard-AI)

---

## 🛑 Problem Statement
Phishing attacks are becoming increasingly sophisticated, bypassing traditional rule-based security filters by utilizing context-aware, zero-day threats. Small businesses and everyday users often lack the enterprise-grade tools necessary to deeply analyze suspicious emails, leading to severe financial and data losses. Traditional ML models can flag an email as spam, but they cannot explain *why* it is dangerous to the end-user.

## 💡 The Solution: PhishGuard AI
PhishGuard AI is an advanced, full-stack cybersecurity platform that provides real-time, **Explainable AI (XAI)** threat classification. It bridges the gap between raw machine learning predictions and human-readable security intelligence, acting as a personal Security Operations Center (SOC) analyst for every user.

---

## 🚀 Comprehensive Feature Set

### 1. Two-Tier AI Architecture (Speed + Intelligence)
Instead of relying entirely on slow LLM calls, PhishGuard AI utilizes a hybrid architecture:
- **Tier 1 (Classical ML):** A custom-trained `scikit-learn` Linear SVM model utilizing TF-IDF vectorization runs on a FastAPI backend. This provides sub-second, blazing-fast baseline classification (Phishing/Spam vs. Safe) with a highly accurate confidence score.
- **Tier 2 (Agentic LLM):** If an email is flagged, the system pipes the text into Google Gemini 1.5 Flash to perform deep, contextual reasoning on the threat.

### 2. Explainable AI (XAI) Threat Reports
When an email is analyzed, the user doesn't just get a "Spam" label. Gemini dynamically analyzes the ML model's prediction and generates a highly detailed, readable security report. It highlights:
- Specific urgency keywords used by the attacker.
- Suspicious URLs or domains hidden in the text.
- The psychological manipulation tactics being used (e.g., "Fear of Missing Out").

### 3. Multimodal OCR (Image Analysis)
Cybercriminals often embed phishing text inside images to bypass text-based spam filters. PhishGuard AI solves this:
- Users can drag-and-drop screenshots or images of suspicious emails directly into the dashboard.
- The system utilizes **Gemini Vision** to perform Optical Character Recognition (OCR), extracting the text from the image and piping it directly into the threat classification pipeline.

### 4. Context-Aware Security Copilot (Chatbot)
The dashboard features a persistent, interactive AI Security Assistant. 
- Unlike a generic ChatGPT wrapper, this Copilot retains the context of the *currently analyzed email*.
- Users can ask follow-up questions like, *"What does this specific URL do?"* or *"How can I safely verify this sender?"*, and the Copilot will provide tailored cybersecurity advice.

### 5. Global Threat Intelligence Feed
The application features a real-time **Global Threat Intelligence Feed** (History tab). When users scan dangerous emails, the metadata is pushed to a centralized Supabase database. This allows all users on the platform to view a live feed of zero-day phishing lures currently circulating in the wild, creating a community-driven defense system.

### 6. Secure Authentication & Data Persistence
- Built on top of **Supabase**, featuring enterprise-grade JWT authentication.
- Users can securely create accounts, log in, and track the community's scanning history.

### 7. Modern, Responsive UI/UX
- Built with **Next.js 16 (App Router)**, **Tailwind CSS**, and **shadcn/ui**.
- Features a dark-mode optimized, futuristic cyber-aesthetic with dynamic loading states and responsive design that works flawlessly on mobile devices.

---

## 🏗️ Technical Architecture & Deployment
The project was explicitly engineered as a decoupled microservices architecture to ensure scalability:

- **Frontend (Vercel):** The Next.js application is deployed to Vercel's global edge network for instant static delivery and serverless API routing.
- **Backend (Render):** A dedicated Python FastAPI server hosts the `joblib` Machine Learning artifacts (`model.pkl`, `vectorizer.pkl`) to keep the heavy data-science dependencies (scikit-learn, numpy) entirely separate from the frontend.
- **CI/CD:** Both Vercel and Render are connected via continuous integration to GitHub. Any push to the `main` branch triggers an automated build and zero-downtime deployment.

## 🤖 Agentic Development Process (AI Collaboration)
This project was heavily steered and built using autonomous AI coding agents. The AI demonstrated genuine agentic behavior beyond simple autocomplete:
1. **Architectural Orchestration:** The agent autonomously designed the decoupled Next.js + FastAPI microservices architecture.
2. **Self-Review & Auditing:** The agent wrote end-to-end testing scripts, ran them locally, identified broken API routes, and autonomously patched the source code until the pipeline turned green.
3. **Planning Loops:** Before implementing major features (like the XAI explanations or OCR extraction), the agent generated structured markdown Implementation Plans, requested human approval, and tracked progress against a living task list.
4. **DevOps & Deployment:** The agent generated production-ready CORS configurations, handled environment variable mappings, and guided the human developer through the CI/CD deployment process to Vercel and Render.
