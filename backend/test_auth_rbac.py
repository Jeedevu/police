"""
Backend Authentication, JWT & RBAC Verification Test Script.
"""
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app

client = TestClient(app)

def test_auth_and_rbac_flow():
    print("--- 1. Testing Admin Login ---")
    res = client.post("/api/auth/login", json={"email": "admin@ksp.gov.in", "password": "Admin@123"})
    print("Status:", res.status_code)
    assert res.status_code == 200, f"Login failed: {res.text}"
    data = res.json()
    assert "tokens" in data
    assert "access_token" in data["tokens"]
    assert "refresh_token" in data["tokens"]
    assert data["officer"]["role"] == "Admin"
    print("[OK] Login successful. User ID:", data["officer"]["id"], "| Role:", data["officer"]["role"])
    print("[OK] Permissions count:", len(data["officer"]["permissions"]))

    access_token = data["tokens"]["access_token"]
    refresh_token = data["tokens"]["refresh_token"]

    print("\n--- 2. Testing Profile / Me Endpoint ---")
    headers = {"Authorization": f"Bearer {access_token}"}
    res_prof = client.get("/api/auth/profile", headers=headers)
    assert res_prof.status_code == 200
    print("[OK] Profile fetched:", res_prof.json()["email"])

    print("\n--- 3. Testing Token Refresh ---")
    res_ref = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert res_ref.status_code == 200
    ref_data = res_ref.json()
    assert "access_token" in ref_data
    print("[OK] Token refreshed successfully.")

    print("\n--- 4. Testing Invalid Password Handling ---")
    res_bad = client.post("/api/auth/login", json={"email": "admin@ksp.gov.in", "password": "WrongPassword123"})
    assert res_bad.status_code == 401
    print("[OK] Invalid password correctly rejected with 401.")

    print("\n--- 5. Testing Inspector Login ---")
    res_ins = client.post("/api/auth/login", json={"email": "jeevan.inspector@ksp.gov.in", "password": "Inspector@123"})
    assert res_ins.status_code == 200
    ins_data = res_ins.json()
    print("[OK] Inspector login successful | Badge:", ins_data["officer"]["badge_number"])

    print("\n=== ALL BACKEND AUTH & RBAC VERIFICATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_auth_and_rbac_flow()
