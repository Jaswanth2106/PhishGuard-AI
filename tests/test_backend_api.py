import unittest
import uuid

from fastapi.testclient import TestClient

from app.main import app
from app.services.ml_prediction_service import MlPredictionService


class BackendApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client_context = TestClient(app, raise_server_exceptions=False)
        cls.client = cls.client_context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client_context.__exit__(None, None, None)

    def test_health_endpoint(self):
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertIn("x-request-id", response.headers)
        payload = response.json()
        self.assertEqual(payload["api_status"], "ok")
        self.assertTrue(payload["model_loaded"])
        self.assertIn("version", payload)
        self.assertIn("timestamp", payload)

    def test_ready_endpoint(self):
        response = self.client.get("/ready")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["ready"])
        self.assertTrue(payload["model_loaded"])
        self.assertTrue(payload["vectorizer_loaded"])
        self.assertIn("timestamp", payload)

    def test_version_endpoint(self):
        response = self.client.get("/version")
        namespaced_response = self.client.get("/api/v1/version")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(namespaced_response.status_code, 200)
        payload = response.json()
        self.assertIn("api_version", payload)
        self.assertIn("model_version", payload)
        self.assertIn("environment", payload)
        self.assertEqual(payload, namespaced_response.json())

    def test_predict_legitimate_email(self):
        response = self.client.post(
            "/predict",
            json={
                "subject": "Project update",
                "body": "Hi team, attached are the quarterly planning notes for review.",
                "metadata": {"reply_to": "manager@example.com"},
            },
            headers={"x-request-id": "test-legitimate"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["x-request-id"], "test-legitimate")
        payload = response.json()
        self.assertEqual(payload["prediction"], "legitimate")
        self.assertEqual(payload["label"], 0)
        self.assertGreaterEqual(payload["confidence_score"], 0)
        self.assertLessEqual(payload["confidence_score"], 1)
        self.assertIn("explanation", payload)
        self.assertIn("top_signals", payload["explanation"])

    def test_predict_phishing_email(self):
        response = self.client.post(
            "/predict",
            json={
                "subject": "URGENT account verification",
                "body": "Immediate action required! Verify your bank account password now at http://verify-example.com/login",
            },
            headers={"x-request-id": "test-phishing"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["prediction"], "phishing_or_spam")
        self.assertEqual(payload["label"], 1)
        self.assertGreaterEqual(payload["probability_like_score"], 0)
        self.assertLessEqual(payload["probability_like_score"], 1)

    def test_empty_body_is_invalid(self):
        response = self.client.post("/predict", json={"subject": "Empty", "body": ""})

        self.assertEqual(response.status_code, 422)
        payload = response.json()
        self.assertEqual(payload["error"]["code"], "validation_error")
        self.assertIn("request_id", payload["error"])

    def test_malformed_request_is_invalid(self):
        response = self.client.post("/predict", json={"subject": "Missing body"})

        self.assertEqual(response.status_code, 422)
        payload = response.json()
        self.assertEqual(payload["error"]["code"], "validation_error")
        self.assertTrue(payload["error"]["details"])

    def test_model_unavailable_scenario(self):
        original_service = app.state.prediction_service
        app.state.prediction_service = None
        try:
            response = self.client.post(
                "/predict",
                json={"subject": "Service unavailable", "body": "This request should fail gracefully."},
            )
        finally:
            app.state.prediction_service = original_service

        self.assertEqual(response.status_code, 503)
        payload = response.json()
        self.assertEqual(payload["error"]["code"], "prediction_service_unavailable")
        self.assertIn("request_id", payload["error"])

    def test_model_load_is_idempotent(self):
        service: MlPredictionService = app.state.prediction_service
        model_id = id(service.model)
        vectorizer_id = id(service.vectorizer)

        service.load()

        self.assertEqual(model_id, id(service.model))
        self.assertEqual(vectorizer_id, id(service.vectorizer))

    def test_auth_registration_login_and_current_user(self):
        email = f"phase35-{uuid.uuid4().hex}@example.com"
        register_response = self.client.post(
            "/auth/register",
            json={"name": "Phase Tester", "email": email, "password": "StrongPass123"},
        )

        self.assertEqual(register_response.status_code, 201)
        register_payload = register_response.json()
        self.assertIn("access_token", register_payload)
        self.assertEqual(register_payload["token_type"], "bearer")
        self.assertEqual(register_payload["user"]["email"], email)
        self.assertNotIn("password", register_payload["user"])
        self.assertNotIn("password_hash", register_payload["user"])

        duplicate_response = self.client.post(
            "/auth/register",
            json={"name": "Phase Tester", "email": email, "password": "StrongPass123"},
        )
        self.assertEqual(duplicate_response.status_code, 409)
        self.assertEqual(duplicate_response.json()["error"]["code"], "email_already_registered")

        login_response = self.client.post(
            "/auth/login",
            json={"email": email, "password": "StrongPass123"},
        )
        self.assertEqual(login_response.status_code, 200)
        token = login_response.json()["access_token"]

        me_response = self.client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.json()["email"], email)

        logout_response = self.client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(logout_response.status_code, 200)
        self.assertEqual(logout_response.json()["message"], "Logged out successfully.")

    def test_auth_rejects_invalid_inputs_and_credentials(self):
        email = f"phase35-{uuid.uuid4().hex}@example.com"

        invalid_email_response = self.client.post(
            "/auth/register",
            json={"name": "Phase Tester", "email": "not-an-email", "password": "StrongPass123"},
        )
        self.assertEqual(invalid_email_response.status_code, 422)

        short_password_response = self.client.post(
            "/auth/register",
            json={"name": "Phase Tester", "email": email, "password": "short"},
        )
        self.assertEqual(short_password_response.status_code, 422)

        self.client.post(
            "/auth/register",
            json={"name": "Phase Tester", "email": email, "password": "StrongPass123"},
        )
        wrong_password_response = self.client.post(
            "/auth/login",
            json={"email": email, "password": "WrongPass123"},
        )
        self.assertEqual(wrong_password_response.status_code, 401)
        self.assertEqual(wrong_password_response.json()["error"]["code"], "invalid_credentials")

        unauthorized_response = self.client.get("/auth/me")
        self.assertEqual(unauthorized_response.status_code, 401)
        self.assertEqual(unauthorized_response.json()["error"]["code"], "not_authenticated")

        invalid_token_response = self.client.get("/auth/me", headers={"Authorization": "Bearer invalid-token"})
        self.assertEqual(invalid_token_response.status_code, 401)
        self.assertEqual(invalid_token_response.json()["error"]["code"], "invalid_token")
    def test_openapi_documents_required_endpoints(self):
        response = self.client.get("/api/v1/openapi.json")

        self.assertEqual(response.status_code, 200)
        schema = response.json()
        paths = schema["paths"]
        for path in ["/predict", "/health", "/ready", "/version"]:
            self.assertIn(path, paths)

        predict_operation = paths["/predict"]["post"]
        self.assertEqual(predict_operation["summary"], "Classify an email")
        self.assertIn("requestBody", predict_operation)
        self.assertIn("responses", predict_operation)


if __name__ == "__main__":
    unittest.main()

