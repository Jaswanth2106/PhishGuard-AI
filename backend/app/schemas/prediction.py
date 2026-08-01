from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class EmailPredictionRequest(BaseModel):
    subject: str = Field(..., min_length=0, description="Email subject line.")
    body: str = Field(..., min_length=1, description="Raw email body text to classify.")
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional email metadata such as sender, reply_to, return_path, or precomputed feature values.",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "subject": "Quarterly planning notes",
                    "body": "Hi team, attached are the quarterly planning notes for review.",
                    "metadata": {"reply_to": "manager@example.com"},
                },
                {
                    "subject": "URGENT account verification",
                    "body": "Immediate action required! Verify your bank account password now at http://verify-example.com/login",
                },
            ]
        }
    )


class EmailFeatures(BaseModel):
    has_reply_to: int
    has_return_path: int
    subject_length: int
    character_count: int
    word_count: int
    sentence_count: int
    average_word_length: float
    uppercase_ratio: float
    digit_ratio: float
    punctuation_ratio: float
    exclamation_count: int
    question_count: int
    url_count: int
    email_count: int
    ip_count: int
    html_tag_count: int
    attachment_keyword_count: int
    urgency_keyword_count: int
    financial_keyword_count: int
    login_keyword_count: int
    cleaned_body: str


class PredictionExplanation(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model_version: str
    decision_score: float
    threshold: float
    top_signals: List[str]
    feature_summary: EmailFeatures


class EmailPredictionResponse(BaseModel):
    prediction: str = Field(..., description="Model classification: legitimate or phishing_or_spam.")
    label: int = Field(..., description="0 means legitimate; 1 means phishing_or_spam.")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Distance-derived confidence for the selected class.")
    probability_like_score: float = Field(..., ge=0.0, le=1.0, description="Sigmoid-normalized LinearSVC decision score for class 1.")
    explanation: PredictionExplanation

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "prediction": "phishing_or_spam",
                "label": 1,
                "confidence_score": 0.8495,
                "probability_like_score": 0.8495,
                "explanation": {
                    "model_version": "2.6.0",
                    "decision_score": 1.731033,
                    "threshold": 0.0,
                    "top_signals": [
                        "contains 1 URL(s)",
                        "contains 4 login/account verification keyword(s)",
                    ],
                    "feature_summary": {
                        "has_reply_to": 0,
                        "has_return_path": 0,
                        "subject_length": 27,
                        "character_count": 98,
                        "word_count": 11,
                        "sentence_count": 1,
                        "average_word_length": 8.0,
                        "uppercase_ratio": 0.08,
                        "digit_ratio": 0.0,
                        "punctuation_ratio": 0.08,
                        "exclamation_count": 1,
                        "question_count": 0,
                        "url_count": 1,
                        "email_count": 0,
                        "ip_count": 0,
                        "html_tag_count": 0,
                        "attachment_keyword_count": 0,
                        "urgency_keyword_count": 2,
                        "financial_keyword_count": 2,
                        "login_keyword_count": 4,
                        "cleaned_body": "Immediate action required! Verify your bank account password now at <URL>",
                    },
                },
            }
        }
    )