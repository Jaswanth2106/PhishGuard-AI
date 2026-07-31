from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.config import settings
from app.db.supabase import supabase

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


class EmailRequest(BaseModel):
    sender: str
    subject: str
    body: str


@app.get("/")
def root():
    return {"message": "Welcome to PhishGuard AI API"}

@app.get("/test-db")
def test_db():
    result = supabase.table("emails").select("*").limit(1).execute()

    return {
        "rows": result.data
    }

@app.post("/predict")
def predict(email: EmailRequest):

    result = supabase.table("emails").insert({
        "sender": email.sender,
        "subject": email.subject,
        "body": email.body,
        "prediction": "Safe",
        "confidence": 0.95
    }).execute()

    return result.data