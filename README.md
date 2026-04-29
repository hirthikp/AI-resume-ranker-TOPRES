# AI Resume Ranker 

An AI-powered recruitment automation system that ranks resumes based on job descriptions using semantic similarity and NLP techniques.

---

## 🔥 Overview

This project helps recruiters automatically evaluate and rank candidates by comparing resumes against job descriptions.
It reduces manual screening effort and improves hiring efficiency using AI.

---

## ✨ Features

* 📄 Upload resumes (PDF/Text)
* 🧠 AI-based semantic matching
* 🎯 Job description vs resume scoring
* 📊 Candidate ranking system
* ⚡ FastAPI backend for high-performance processing
* 🌐 Interactive frontend UI

---

## 🏗️ Tech Stack

* **Frontend:** React / TypeScript
* **Backend:** FastAPI (Python)
* **Database:** PostgreSQL / Supabase
* **AI/NLP:** Embeddings + Semantic Similarity
* **Deployment:** Docker + AWS EC2

---

## ⚙️ How It Works

1. Upload resumes and a job description
2. Extract text from resumes
3. Convert text into embeddings
4. Compute similarity scores
5. Rank candidates based on relevance

---

## 🛠️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/hirthikp/AI-resume-ranker-TOPRES.git
cd AI-resume-ranker-TOPRES
```

---

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in the backend:

```env
OPENAI_API_KEY=your_api_key
DATABASE_URL=your_database_url
```

---

## 📂 Project Structure

```
AI-resume-ranker-TOPRES/
│── backend/
│   ├── main.py
│   ├── routes/
│   ├── services/
│── frontend/
│   ├── src/
│── docker/
│── README.md
```

---

## 🚀 Future Improvements

* Resume parsing improvements (NER, skills extraction)
* Better ranking models
* Real-time analytics dashboard
* Authentication & user management

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📜 License

This project is open-source and available under the MIT License.
