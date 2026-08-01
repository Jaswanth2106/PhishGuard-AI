from pydantic import BaseModel, ConfigDict


class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: str
    details: object | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "code": "validation_error",
                "message": "Request validation failed.",
                "request_id": "2c1bb78d-5d02-4d84-b69f-08b395e5b7d1",
                "details": [
                    {
                        "type": "missing",
                        "loc": ["body", "body"],
                        "msg": "Field required",
                    }
                ],
            }
        }
    )


class ErrorResponse(BaseModel):
    error: ErrorDetail


class HealthResponse(BaseModel):
    api_status: str
    model_loaded: bool
    version: str
    timestamp: str

    model_config = ConfigDict(
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "api_status": "ok",
                "model_loaded": True,
                "version": "3.2.0",
                "timestamp": "2026-07-31T11:17:41.313069+00:00",
            }
        },
    )


class ReadinessResponse(BaseModel):
    ready: bool
    model_loaded: bool
    vectorizer_loaded: bool
    timestamp: str

    model_config = ConfigDict(
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "ready": True,
                "model_loaded": True,
                "vectorizer_loaded": True,
                "timestamp": "2026-07-31T11:17:41.316584+00:00",
            }
        },
    )


class VersionResponse(BaseModel):
    api_version: str
    model_version: str
    environment: str

    model_config = ConfigDict(
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "api_version": "3.2.0",
                "model_version": "2.6.0",
                "environment": "development",
            }
        },
    )


class RootResponse(BaseModel):
    message: str

    model_config = ConfigDict(
        json_schema_extra={"example": {"message": "Welcome to PhishGuard AI API"}}
    )