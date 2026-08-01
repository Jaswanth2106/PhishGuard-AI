import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import configure_logging
from app.core.security import get_current_user
from app.db.session import get_db, init_db
from app.models.user import User
from app.schemas.auth import (
    AuthTokenResponse,
    LogoutResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.middleware.request_logging import RequestLoggingMiddleware
from app.schemas.prediction import EmailPredictionRequest, EmailPredictionResponse
from app.schemas.system import ErrorResponse, HealthResponse, ReadinessResponse, RootResponse, VersionResponse
from app.services.auth_service import authenticate_user, issue_token, register_user
from app.services.ml_prediction_service import MlPredictionService, ModelNotLoadedError

configure_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

ERROR_RESPONSES = {
    422: {
        "model": ErrorResponse,
        "description": "The request payload failed validation.",
        "content": {
            "application/json": {
                "example": {
                    "error": {
                        "code": "validation_error",
                        "message": "Request validation failed.",
                        "request_id": "8eb01bb4-c2dc-48c8-a293-eec95dcb544a",
                        "details": [
                            {
                                "type": "missing",
                                "loc": ["body", "body"],
                                "msg": "Field required",
                            }
                        ],
                    }
                }
            }
        },
    },
    500: {
        "model": ErrorResponse,
        "description": "The prediction service failed while processing the request.",
        "content": {
            "application/json": {
                "example": {
                    "error": {
                        "code": "prediction_failed",
                        "message": "Prediction failed.",
                        "request_id": "8eb01bb4-c2dc-48c8-a293-eec95dcb544a",
                        "details": None,
                    }
                }
            }
        },
    },
    503: {
        "model": ErrorResponse,
        "description": "The model or vectorizer is not available.",
        "content": {
            "application/json": {
                "example": {
                    "error": {
                        "code": "prediction_service_unavailable",
                        "message": "Prediction service is not available.",
                        "request_id": "8eb01bb4-c2dc-48c8-a293-eec95dcb544a",
                        "details": None,
                    }
                }
            }
        },
    },
}


def utc_timestamp() -> str:
    """Return an ISO-8601 UTC timestamp for API status responses."""
    return datetime.now(timezone.utc).isoformat()


def get_prediction_service(request: Request) -> MlPredictionService:
    """Fetch the process-local prediction service initialized during FastAPI startup."""
    service: MlPredictionService = getattr(request.app.state, "prediction_service", None)
    if service is None:
        raise ModelNotLoadedError("Prediction service is not initialized.")
    return service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the packaged model and vectorizer once for the application process."""
    init_db()
    prediction_service = MlPredictionService(
        model_path=settings.MODEL_PATH,
        vectorizer_path=settings.VECTORIZER_PATH,
        model_version=settings.MODEL_VERSION,
    )
    prediction_service.load()
    app.state.prediction_service = prediction_service
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    summary="Backend API for PhishGuard AI email threat classification.",
    description=(
        "PhishGuard AI exposes a production Linear SVM email classifier with health, "
        "readiness, version, and prediction endpoints. The model is loaded once during "
        "application startup and each request receives a request ID for traceability."
    ),
    contact={"name": "PhishGuard AI Backend"},
    openapi_tags=[
        {"name": "status", "description": "Operational health, readiness, and version endpoints."},
        {"name": "prediction", "description": "Email threat classification endpoints."},
        {"name": "auth", "description": "User registration, login, logout, and current-user endpoints."},
        {"name": "database", "description": "Database connectivity diagnostics."},
    ],
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(RequestLoggingMiddleware)
register_exception_handlers(app)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Basic in-memory rate limiting dict (for demonstration/Phase 9)
import time
RATE_LIMIT_DICT = {}
RATE_LIMIT_MAX = 100
RATE_LIMIT_WINDOW = 60

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    if client_ip not in RATE_LIMIT_DICT:
        RATE_LIMIT_DICT[client_ip] = []
        
    # Clean up old requests
    RATE_LIMIT_DICT[client_ip] = [t for t in RATE_LIMIT_DICT[client_ip] if current_time - t < RATE_LIMIT_WINDOW]
    
    if len(RATE_LIMIT_DICT[client_ip]) >= RATE_LIMIT_MAX:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Please try again later."})
        
    RATE_LIMIT_DICT[client_ip].append(current_time)
    return await call_next(request)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get(
    "/",
    response_model=RootResponse,
    tags=["status"],
    summary="API welcome message",
    description="Returns a simple welcome payload confirming that the API process is responding.",
)
def root():
    """Return a lightweight welcome message for basic connectivity checks."""
    return {"message": "Welcome to PhishGuard AI API"}


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["status"],
    summary="Check API health",
    description="Returns API status, model loaded state, API version, and the current server timestamp.",
)
def health(request: Request):
    """Report basic API health and whether the prediction service is loaded."""
    service = getattr(request.app.state, "prediction_service", None)
    return {
        "api_status": "ok",
        "model_loaded": bool(service and service.is_loaded),
        "version": settings.API_VERSION,
        "timestamp": utc_timestamp(),
    }


@app.get(
    "/ready",
    response_model=ReadinessResponse,
    tags=["status"],
    summary="Check model readiness",
    description="Reports whether both the model and vectorizer are loaded and ready for prediction requests.",
)
def ready(request: Request):
    """Report readiness of the model and vectorizer artifacts."""
    service = getattr(request.app.state, "prediction_service", None)
    model_loaded = bool(service and service.model_loaded)
    vectorizer_loaded = bool(service and service.vectorizer_loaded)
    return {
        "ready": model_loaded and vectorizer_loaded,
        "model_loaded": model_loaded,
        "vectorizer_loaded": vectorizer_loaded,
        "timestamp": utc_timestamp(),
    }


@app.get(
    "/version",
    response_model=VersionResponse,
    tags=["status"],
    summary="Get API version",
    description="Returns the configured API version, packaged model version, and runtime environment name.",
)
def version():
    """Return API and model version metadata."""
    return {
        "api_version": settings.API_VERSION,
        "model_version": settings.MODEL_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get(
    f"{settings.API_V1_STR}/version",
    response_model=VersionResponse,
    tags=["status"],
    summary="Get version from API namespace",
    description="Version endpoint exposed under the configured API namespace for clients that prefer versioned paths.",
)
def api_version():
    """Return API and model version metadata from the configured API namespace."""
    return version()


@app.post(
    "/auth/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["auth"],
    summary="Register a user",
    description="Creates a user account with a bcrypt password hash and returns a JWT access token.",
    responses={409: {"model": ErrorResponse, "description": "The email is already registered."}},
)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user and issue a short-lived access token."""
    user = register_user(db, payload)
    token, expires_in = issue_token(user)
    return {"access_token": token, "token_type": "bearer", "expires_in": expires_in, "user": user}


@app.post(
    "/auth/login",
    response_model=AuthTokenResponse,
    tags=["auth"],
    summary="Log in a user",
    description="Validates credentials and returns a JWT access token without exposing password details.",
    responses={401: {"model": ErrorResponse, "description": "Invalid email or password."}},
)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate a registered user and issue an access token."""
    user = authenticate_user(db, payload)
    token, expires_in = issue_token(user)
    return {"access_token": token, "token_type": "bearer", "expires_in": expires_in, "user": user}


@app.get(
    "/auth/me",
    response_model=UserResponse,
    tags=["auth"],
    summary="Get current user",
    description="Returns the authenticated user represented by the supplied bearer token.",
    responses={401: {"model": ErrorResponse, "description": "Missing, invalid, or expired token."}},
)
def current_user(user: User = Depends(get_current_user)):
    """Return the user associated with the current JWT."""
    return user


@app.post(
    "/auth/logout",
    response_model=LogoutResponse,
    tags=["auth"],
    summary="Log out current session",
    description="Stateless JWT logout endpoint. Clients should discard the stored token after this response.",
)
def logout(user: User = Depends(get_current_user)):
    """Acknowledge logout for clients using stateless bearer tokens."""
    return {"message": "Logged out successfully."}


@app.get(
    "/test-db",
    tags=["database"],
    summary="Test database connectivity",
    description="Performs a one-row Supabase read to validate backend database connectivity. Requires a valid bearer token.",
)
def test_db(user: User = Depends(get_current_user)):
    """Run a minimal Supabase read for manual database diagnostics."""
    from app.db.supabase import supabase

    result = supabase.table("emails").select("*").limit(1).execute()

    return {
        "rows": result.data
    }


@app.post(
    "/predict",
    response_model=EmailPredictionResponse,
    tags=["prediction"],
    summary="Classify an email",
    description=(
        "Classifies an email as legitimate or phishing/spam using the packaged Linear SVM model. "
        "The endpoint accepts subject, body, and optional metadata, reproduces the Phase 2 feature "
        "engineering pipeline, and returns confidence, normalized decision score, and explanation fields."
    ),
    responses=ERROR_RESPONSES,
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "examples": {
                        "legitimate": {
                            "summary": "Legitimate business email",
                            "value": {
                                "subject": "Quarterly planning notes",
                                "body": "Hi team, attached are the quarterly planning notes for review.",
                                "metadata": {"reply_to": "manager@example.com"},
                            },
                        },
                        "phishing": {
                            "summary": "Phishing-style account verification email",
                            "value": {
                                "subject": "URGENT account verification",
                                "body": "Immediate action required! Verify your bank account password now at http://verify-example.com/login",
                            },
                        },
                    }
                }
            }
        }
    },
)
def predict(email: EmailPredictionRequest, request: Request):
    """Run preprocessing and model inference for one email payload."""
    service = get_prediction_service(request)
    return service.predict(
        subject=email.subject,
        body=email.body,
        metadata=email.metadata,
    )

