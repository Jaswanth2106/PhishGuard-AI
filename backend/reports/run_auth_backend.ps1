$env:PYTHONPATH = "backend"
$env:BACKEND_CORS_ORIGINS = '["http://localhost:3000","http://127.0.0.1:3000"]'
& ".\backend\venv\Scripts\python.exe" -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
