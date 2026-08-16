import unittest
import requests
import os

class TestAsthmaSenseSecurity(unittest.TestCase):
    
    BASE_URL = os.environ.get("TEST_API_URL", "http://localhost:5000")
    
    def setUp(self):
        # Health check to see if the server is active
        try:
            r = requests.get(f"{self.BASE_URL}/api/health", timeout=3)
            self.server_active = (r.status_code == 200)
        except Exception:
            self.server_active = False

        if not self.server_active:
            self.skipTest("AsthmaSense AI Backend server is not running or accessible.")

    def test_idor_prevention_on_symptoms(self):
        """TC-SEC-042: Verify User A cannot access User B's symptom logs via IDOR."""
        # 1. Register User A
        user_a_data = {
            "name": "User A Security",
            "email": "usera_sec@asthmasense.ai",
            "password": "Password123!"
        }
        # Try to register/login (catch conflict if already exists)
        requests.post(f"{self.BASE_URL}/api/auth/register", json=user_a_data)
        login_a = requests.post(f"{self.BASE_URL}/api/auth/login", json={
            "email": user_a_data["email"],
            "password": user_a_data["password"]
        }).json()
        token_a = login_a.get("token")

        # 2. Register User B
        user_b_data = {
            "name": "User B Security",
            "email": "userb_sec@asthmasense.ai",
            "password": "Password123!"
        }
        requests.post(f"{self.BASE_URL}/api/auth/register", json=user_b_data)
        login_b = requests.post(f"{self.BASE_URL}/api/auth/login", json={
            "email": user_b_data["email"],
            "password": user_b_data["password"]
        }).json()
        token_b = login_b.get("token")
        
        self.assertIsNotNone(token_a, "Failed to authenticate User A")
        self.assertIsNotNone(token_b, "Failed to authenticate User B")

        # 3. Create a symptom log for User B
        headers_b = {"Authorization": f"Bearer {token_b}"}
        symptom_payload = {
            "symptom": "Coughing",
            "severity": "Moderate",
            "time": "Evening",
            "notes": "User B private log"
        }
        symptom_res = requests.post(f"{self.BASE_URL}/api/data/symptoms", json=symptom_payload, headers=headers_b)
        self.assertEqual(symptom_res.status_code, 201)
        symptom_id = symptom_res.json().get("_id")

        # 4. User A attempts to fetch symptoms - verified by JWT, should return only User A's data
        headers_a = {"Authorization": f"Bearer {token_a}"}
        get_symptoms_a = requests.get(f"{self.BASE_URL}/api/data/symptoms", headers=headers_a)
        self.assertEqual(get_symptoms_a.status_code, 200)
        
        # Verify User B's symptom log ID is NOT in User A's fetched logs
        logs_a = get_symptoms_a.json()
        for log in logs_a:
            self.assertNotEqual(log.get("_id"), symptom_id, "IDOR Vulnerability: User A accessed User B's private log!")

    def test_nosql_injection_blockage(self):
        """TC-SEC-108: Verify backend registration rejects MongoDB NoSQL Injection payloads."""
        payload = {
            "name": "Hacker",
            "email": {"$gt": ""},
            "password": "mypassword"
        }
        res = requests.post(f"{self.BASE_URL}/api/auth/register", json=payload)
        # Should fail with 400 Bad Request or server validation error
        self.assertIn(res.status_code, [400, 500])

if __name__ == "__main__":
    unittest.main()
