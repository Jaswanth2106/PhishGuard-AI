# Backend API Testing Guide

This guide covers local testing for the PhishGuard AI FastAPI backend after Phase 3.3.

## Prerequisites

Run commands from the repository root:

```powershell
cd C:\Users\user\Desktop\Spam_Email_Detector
```

Use the backend virtual environment:

```powershell
backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

The production ML artifacts are expected at:

- `ml/models/model.pkl`
- `ml/models/vectorizer.pkl`

Do not retrain or refit the model for backend testing.

## Start the Backend Locally

```powershell
$env:PYTHONPATH="backend"
backend\venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload
```

Default local base URL:

```text
http://127.0.0.1:8000
```

## OpenAPI Documentation

FastAPI serves generated OpenAPI docs at:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- OpenAPI JSON: `http://127.0.0.1:8000/api/v1/openapi.json`

A generated snapshot is also written during Phase 3.3 verification to:

- `backend/reports/openapi.json`

## Manual Endpoint Checks

### Health

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

Expected: `api_status` is `ok`, `model_loaded` is `true`.

### Readiness

```powershell
Invoke-RestMethod http://127.0.0.1:8000/ready
```

Expected: `ready`, `model_loaded`, and `vectorizer_loaded` are `true`.

### Version

```powershell
Invoke-RestMethod http://127.0.0.1:8000/version
Invoke-RestMethod http://127.0.0.1:8000/api/v1/version
```

Expected: response includes `api_version`, `model_version`, and `environment`.

### Predict

```powershell
$payload = @{
  subject = "URGENT account verification"
  body = "Immediate action required! Verify your bank account password now at http://verify-example.com/login"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8000/predict `
  -ContentType "application/json" `
  -Body $payload
```

Expected: response includes `prediction`, `confidence_score`, `probability_like_score`, and `explanation`.

## Postman

Import this collection into Postman:

- `backend/postman/PhishGuard_Backend_API.postman_collection.json`

Set collection variable `baseUrl` to your backend URL, for example `http://127.0.0.1:8000`.

## Automated Tests

Run the backend test suite:

```powershell
$env:PYTHONPATH="backend"
backend\venv\Scripts\python.exe -m unittest discover -s tests -p "test_backend_api.py" -v
```

The suite validates:

- `/predict`
- `/health`
- `/ready`
- `/version`
- invalid payloads
- model unavailable scenario
- OpenAPI contains documented endpoints

## Verification Report

Phase 3.3 writes test results to:

- `backend/reports/api_testing_report.json`