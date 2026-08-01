import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.services.ml_prediction_service import ModelNotLoadedError, PredictionError

logger = logging.getLogger(__name__)


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


def error_payload(code: str, message: str, request_id: str, details: Any = None) -> dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "request_id": request_id,
            "details": details,
        }
    }


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        request_id = _request_id(request)
        logger.warning(
            "request_validation_failed",
            extra={"request_id": request_id, "path": request.url.path, "errors": exc.errors()},
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_payload(
                code="validation_error",
                message="Request validation failed.",
                request_id=request_id,
                details=exc.errors(),
            ),
        )

    @app.exception_handler(ModelNotLoadedError)
    async def model_not_loaded_handler(request: Request, exc: ModelNotLoadedError) -> JSONResponse:
        request_id = _request_id(request)
        logger.error(
            "prediction_service_unavailable",
            extra={"request_id": request_id, "path": request.url.path},
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=error_payload(
                code="prediction_service_unavailable",
                message="Prediction service is not available.",
                request_id=request_id,
            ),
        )

    @app.exception_handler(PredictionError)
    async def prediction_error_handler(request: Request, exc: PredictionError) -> JSONResponse:
        request_id = _request_id(request)
        logger.error(
            "prediction_failed",
            extra={"request_id": request_id, "path": request.url.path},
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_payload(
                code="prediction_failed",
                message="Prediction failed.",
                request_id=request_id,
            ),
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
        request_id = _request_id(request)
        logger.warning(
            "request_value_error",
            extra={"request_id": request_id, "path": request.url.path, "error": str(exc)},
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_payload(
                code="invalid_request",
                message=str(exc),
                request_id=request_id,
            ),
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        request_id = _request_id(request)
        detail = exc.detail
        if isinstance(detail, dict):
            code = str(detail.get("code", "http_error"))
            message = str(detail.get("message", "Request failed."))
            details = detail.get("details")
        else:
            code = "http_error"
            message = str(detail)
            details = None
        logger.warning(
            "http_exception",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "status_code": exc.status_code,
                "error_code": code,
            },
        )
        return JSONResponse(
            status_code=exc.status_code,
            headers=exc.headers,
            content=error_payload(
                code=code,
                message=message,
                request_id=request_id,
                details=details,
            ),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = _request_id(request)
        logger.exception(
            "unhandled_exception",
            extra={"request_id": request_id, "path": request.url.path},
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_payload(
                code="internal_server_error",
                message="Internal server error.",
                request_id=request_id,
            ),
        )
