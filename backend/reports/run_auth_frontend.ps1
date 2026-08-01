Set-Location ".\frontend"
$env:NEXT_PUBLIC_BACKEND_API_URL = "http://127.0.0.1:8000"
npm run start -- --hostname 127.0.0.1 --port 3000
