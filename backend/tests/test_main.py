import unittest
from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app

class TestMainAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_root(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "Welcome to PhishGuard AI API"})

    def test_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["api_status"], "ok")
        self.assertIn("version", data)

    def test_version(self):
        response = self.client.get("/version")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("api_version", data)
        self.assertIn("model_version", data)
        self.assertIn("environment", data)

    def test_ready(self):
        response = self.client.get("/ready")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("ready", data)

if __name__ == '__main__':
    unittest.main()
