import logging
import math
import re
import string
import unicodedata
from pathlib import Path
from typing import Any, Dict, Iterable, Optional

import joblib
import pandas as pd

from app.schemas.prediction import EmailFeatures

logger = logging.getLogger(__name__)

URL_PATTERN = re.compile(r"https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+|www\.[-\w.]+")
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
IP_PATTERN = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
HASH_PATTERN = re.compile(r"\b[a-fA-F0-9]{32,}\b")
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")

ATTACHMENT_KWS = {"attachment", "attached", "pdf", "invoice", "receipt", "document", "file"}
URGENCY_KWS = {"urgent", "immediate", "action required", "act now", "soon", "immediately", "important"}
FINANCIAL_KWS = {"bank", "account", "payment", "transfer", "billing", "credit card", "transaction", "invoice"}
LOGIN_KWS = {"login", "sign in", "password", "verify", "update", "confirm", "authentication"}

FEATURE_COLUMNS = [
    "cleaned_body",
    "has_reply_to",
    "has_return_path",
    "subject_length",
    "character_count",
    "word_count",
    "sentence_count",
    "average_word_length",
    "uppercase_ratio",
    "digit_ratio",
    "punctuation_ratio",
    "exclamation_count",
    "question_count",
    "url_count",
    "email_count",
    "ip_count",
    "html_tag_count",
    "attachment_keyword_count",
    "urgency_keyword_count",
    "financial_keyword_count",
    "login_keyword_count",
]

NUMERIC_COLUMNS = [column for column in FEATURE_COLUMNS if column != "cleaned_body"]


class ModelNotLoadedError(RuntimeError):
    pass


class PredictionError(RuntimeError):
    pass


class MlPredictionService:
    def __init__(
        self,
        model_path: Optional[Path] = None,
        vectorizer_path: Optional[Path] = None,
        model_version: str = "2.6.0",
    ) -> None:
        project_root = Path(__file__).resolve().parents[3]
        self.model_path = self._resolve_path(model_path, project_root / "ml" / "models" / "model.pkl")
        self.vectorizer_path = self._resolve_path(vectorizer_path, project_root / "ml" / "models" / "vectorizer.pkl")
        self.model_version = model_version
        self.model = None
        self.vectorizer = None

    @property
    def is_loaded(self) -> bool:
        return self.model_loaded and self.vectorizer_loaded

    @property
    def model_loaded(self) -> bool:
        return self.model is not None

    @property
    def vectorizer_loaded(self) -> bool:
        return self.vectorizer is not None

    def load(self) -> None:
        if self.is_loaded:
            logger.info(
                "ml_model_load_skipped",
                extra={"model_version": self.model_version},
            )
            return

        try:
            logger.info(
                "ml_model_load_started",
                extra={
                    "model_path": str(self.model_path),
                    "vectorizer_path": str(self.vectorizer_path),
                },
            )
            self.vectorizer = joblib.load(self.vectorizer_path)
            self.model = joblib.load(self.model_path)
            logger.info(
                "ml_model_load_completed",
                extra={
                    "model_class": type(self.model).__name__,
                    "vectorizer_class": type(self.vectorizer).__name__,
                    "model_version": self.model_version,
                },
            )
        except Exception:
            logger.exception(
                "ml_model_load_failed",
                extra={
                    "model_path": str(self.model_path),
                    "vectorizer_path": str(self.vectorizer_path),
                },
            )
            raise

    def predict(self, subject: str, body: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.is_loaded:
            raise ModelNotLoadedError("ML model and vectorizer have not been loaded.")

        try:
            features = self.preprocess(subject=subject, body=body, metadata=metadata)
            frame = pd.DataFrame([features.model_dump()], columns=FEATURE_COLUMNS)
            transformed = self.vectorizer.transform(frame)
            label = int(self.model.predict(transformed)[0])
            decision_score = float(self.model.decision_function(transformed)[0])
            probability_like_score = self._sigmoid(decision_score)
            confidence_score = max(probability_like_score, 1.0 - probability_like_score)
            prediction = "phishing_or_spam" if label == 1 else "legitimate"

            logger.info(
                "ml_prediction_completed",
                extra={
                    "prediction": prediction,
                    "label": label,
                    "decision_score": round(decision_score, 6),
                    "confidence_score": round(confidence_score, 6),
                    "probability_like_score": round(probability_like_score, 6),
                },
            )

            return {
                "prediction": prediction,
                "label": label,
                "confidence_score": confidence_score,
                "probability_like_score": probability_like_score,
                "explanation": {
                    "model_version": self.model_version,
                    "decision_score": decision_score,
                    "threshold": 0.0,
                    "top_signals": self._top_signals(features),
                    "feature_summary": features,
                },
            }
        except ModelNotLoadedError:
            raise
        except Exception as exc:
            logger.exception("ml_prediction_failed")
            raise PredictionError("Prediction failed.") from exc

    def preprocess(self, subject: str, body: str, metadata: Optional[Dict[str, Any]] = None) -> EmailFeatures:
        metadata = metadata or {}
        text = unicodedata.normalize("NFKC", str(body or ""))
        words = text.split()
        character_count = len(text)
        word_count = len(words)
        sentences = re.split(r"[.!?]+", text)
        sentence_count = len([sentence for sentence in sentences if sentence.strip()])
        average_word_length = sum(len(word) for word in words) / word_count if word_count > 0 else 0.0

        uppercase_count = sum(1 for character in text if character.isupper())
        digit_count = sum(1 for character in text if character.isdigit())
        punctuation_count = sum(1 for character in text if character in string.punctuation)

        cleaned_body = URL_PATTERN.sub("<URL>", text)
        cleaned_body = EMAIL_PATTERN.sub("<EMAIL>", cleaned_body)
        cleaned_body = IP_PATTERN.sub("<IP>", cleaned_body)
        cleaned_body = HASH_PATTERN.sub("<HASH>", cleaned_body)
        cleaned_body = re.sub(r"\s+", " ", cleaned_body).strip()

        features = {
            "has_reply_to": self._bool_feature(metadata.get("has_reply_to", metadata.get("reply_to"))),
            "has_return_path": self._bool_feature(metadata.get("has_return_path", metadata.get("return_path"))),
            "subject_length": len(str(subject)) if subject is not None else 0,
            "character_count": character_count,
            "word_count": word_count,
            "sentence_count": sentence_count,
            "average_word_length": average_word_length,
            "uppercase_ratio": uppercase_count / character_count if character_count > 0 else 0.0,
            "digit_ratio": digit_count / character_count if character_count > 0 else 0.0,
            "punctuation_ratio": punctuation_count / character_count if character_count > 0 else 0.0,
            "exclamation_count": text.count("!"),
            "question_count": text.count("?"),
            "url_count": len(URL_PATTERN.findall(text)),
            "email_count": len(EMAIL_PATTERN.findall(text)),
            "ip_count": len(IP_PATTERN.findall(text)),
            "html_tag_count": len(HTML_TAG_PATTERN.findall(text)),
            "attachment_keyword_count": self._count_keywords(text, ATTACHMENT_KWS),
            "urgency_keyword_count": self._count_keywords(text, URGENCY_KWS),
            "financial_keyword_count": self._count_keywords(text, FINANCIAL_KWS),
            "login_keyword_count": self._count_keywords(text, LOGIN_KWS),
            "cleaned_body": cleaned_body,
        }

        for column in NUMERIC_COLUMNS:
            if column in metadata and metadata[column] is not None:
                features[column] = metadata[column]

        return EmailFeatures(**features)

    def _top_signals(self, features: EmailFeatures) -> list[str]:
        signals = []
        if features.url_count:
            signals.append(f"contains {features.url_count} URL(s)")
        if features.login_keyword_count:
            signals.append(f"contains {features.login_keyword_count} login/account verification keyword(s)")
        if features.financial_keyword_count:
            signals.append(f"contains {features.financial_keyword_count} financial keyword(s)")
        if features.urgency_keyword_count:
            signals.append(f"contains {features.urgency_keyword_count} urgency keyword(s)")
        if features.attachment_keyword_count:
            signals.append(f"contains {features.attachment_keyword_count} attachment-related keyword(s)")
        if features.html_tag_count:
            signals.append(f"contains {features.html_tag_count} HTML tag(s)")
        if features.ip_count:
            signals.append(f"contains {features.ip_count} IP address(es)")
        if not signals:
            signals.append("no high-risk engineered metadata signals detected")
        return signals

    @staticmethod
    def _resolve_path(path: Optional[Path], default_path: Path) -> Path:
        if path is None:
            return default_path
        resolved = Path(path)
        if resolved.is_absolute():
            return resolved
        project_root = Path(__file__).resolve().parents[3]
        return project_root / resolved

    @staticmethod
    def _count_keywords(text: str, keywords: Iterable[str]) -> int:
        text_lower = text.lower()
        return sum(len(re.findall(r"\b" + re.escape(keyword) + r"\b", text_lower)) for keyword in keywords)

    @staticmethod
    def _bool_feature(value: Any) -> int:
        if isinstance(value, bool):
            return int(value)
        if isinstance(value, (int, float)):
            return int(value > 0)
        if value is None:
            return 0
        return int(bool(str(value).strip()))

    @staticmethod
    def _sigmoid(score: float) -> float:
        if score >= 0:
            z = math.exp(-score)
            return 1.0 / (1.0 + z)
        z = math.exp(score)
        return z / (1.0 + z)