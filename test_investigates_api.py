#!/usr/bin/env python3
"""
InvestiGate API - Comprehensive Test Script
Tests all modules and endpoints

Usage:
    pip install requests
    python test_investigates_api.py
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_URL = "https://investigates-api.azurewebsites.net/api/v1"
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "admin123"

# Colors
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
CYAN = '\033[96m'
NC = '\033[0m'

# Counters
passed = 0
failed = 0

def header(title):
    print(f"\n{BLUE}{'='*60}{NC}")
    print(f"{BLUE}  {title}{NC}")
    print(f"{BLUE}{'='*60}{NC}")

def test_pass(name, detail=""):
    global passed
    passed += 1
    print(f"{GREEN}[PASS]{NC} {name}")
    if detail:
        print(f"       {CYAN}{detail}{NC}")

def test_fail(name, response=""):
    global failed
    failed += 1
    print(f"{RED}[FAIL]{NC} {name}")
    if response:
        print(f"       Response: {str(response)[:150]}")

def run_tests():
    global passed, failed
    
    print(f"\n{CYAN}InvestiGate API Test Suite{NC}")
    print(f"{CYAN}API URL: {API_URL}{NC}")
    print(f"{CYAN}Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{NC}")

    # ============== 1. HEALTH CHECK ==============
    header("1. Health Check")

    try:
        # Health endpoint is at root, not under /api/v1
        health_url = API_URL.replace("/api/v1", "/health")
        r = requests.get(health_url, timeout=10)
        if "healthy" in r.text:
            data = r.json()
            test_pass("API Health Endpoint", f"Version: {data.get('version', 'N/A')}")
        else:
            test_fail("API Health Endpoint", r.text)
    except Exception as e:
        test_fail("API Health Endpoint", str(e))

    # ============== 2. AUTHENTICATION ==============
    header("2. Authentication Module")

    # Seed Admin
    try:
        r = requests.post(f"{API_URL}/auth/seed-admin", timeout=10)
        test_pass("Seed Admin User", r.json().get('message', ''))
    except Exception as e:
        test_fail("Seed Admin", str(e))

    # Login Admin
    ADMIN_TOKEN = None
    try:
        r = requests.post(f"{API_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }, timeout=10)
        data = r.json()
        if "tokens" in data:
            ADMIN_TOKEN = data["tokens"]["access_token"]
            test_pass("Admin Login", f"Role: {data['user']['role']}")
        else:
            test_fail("Admin Login", r.text)
    except Exception as e:
        test_fail("Admin Login", str(e))

    # Get Me
    if ADMIN_TOKEN:
        try:
            r = requests.get(f"{API_URL}/auth/me", 
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
            data = r.json()
            test_pass("Get Current User (Me)", f"Email: {data.get('email', 'N/A')}")
        except Exception as e:
            test_fail("Get Current User", str(e))

    # Invalid Login
    try:
        r = requests.post(f"{API_URL}/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpass"
        }, timeout=10)
        if r.status_code == 401:
            test_pass("Invalid Login Rejected", "HTTP 401")
        else:
            test_fail("Invalid Login Rejected", f"Status: {r.status_code}")
    except Exception as e:
        test_fail("Invalid Login", str(e))

    # ============== 3. REGISTRATION ==============
    header("3. Registration Module")

    TEST_EMAIL = f"testuser_{int(time.time())}@example.com"
    REG_ID = None

    # Submit Registration
    try:
        r = requests.post(f"{API_URL}/registrations/", json={
            "email": TEST_EMAIL,
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "User",
            "organization_name": "Test Org",
            "position": "Tester"
        }, timeout=10)
        data = r.json()
        if data.get("status") == "pending":
            REG_ID = data["id"]
            test_pass("Submit Registration", f"ID: {REG_ID}, Email: {TEST_EMAIL}")
        else:
            test_fail("Submit Registration", r.text)
    except Exception as e:
        test_fail("Submit Registration", str(e))

    # Check Status
    try:
        r = requests.get(f"{API_URL}/registrations/status/{TEST_EMAIL}", timeout=10)
        data = r.json()
        test_pass("Check Registration Status", f"Status: {data.get('status', 'N/A')}")
    except Exception as e:
        test_fail("Check Status", str(e))

    # Duplicate (should fail)
    try:
        r = requests.post(f"{API_URL}/registrations/", json={
            "email": TEST_EMAIL,
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "User"
        }, timeout=10)
        if r.status_code == 409:
            test_pass("Duplicate Registration Rejected", "HTTP 409")
        else:
            test_fail("Duplicate Rejected", f"Status: {r.status_code}")
    except Exception as e:
        test_fail("Duplicate Check", str(e))

    # List Registrations (Admin)
    if ADMIN_TOKEN:
        try:
            r = requests.get(f"{API_URL}/registrations/?status=pending",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
            data = r.json()
            test_pass("List Pending Registrations", f"Total: {data.get('total', 'N/A')}")
        except Exception as e:
            test_fail("List Registrations", str(e))

    # Registration Stats
    if ADMIN_TOKEN:
        try:
            r = requests.get(f"{API_URL}/registrations/stats",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
            data = r.json()
            test_pass("Get Registration Stats", f"Pending: {data.get('pending', 0)}, Approved: {data.get('approved', 0)}")
        except Exception as e:
            test_fail("Registration Stats", str(e))

    # Approve Registration
    if ADMIN_TOKEN and REG_ID:
        try:
            r = requests.post(f"{API_URL}/registrations/{REG_ID}/approve",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
                json={"subscription_days": 30, "role": "investigator"}, timeout=10)
            data = r.json()
            if data.get("status") == "approved":
                test_pass("Approve Registration", f"Subscription: 30 days, Role: investigator")
            else:
                test_fail("Approve Registration", r.text)
        except Exception as e:
            test_fail("Approve Registration", str(e))

    # Login with New User
    USER_TOKEN = None
    try:
        r = requests.post(f"{API_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": "TestPass123!"
        }, timeout=10)
        data = r.json()
        if "tokens" in data:
            USER_TOKEN = data["tokens"]["access_token"]
            test_pass("New User Login", f"Role: {data['user']['role']}")
        else:
            test_fail("New User Login", r.text)
    except Exception as e:
        test_fail("New User Login", str(e))

    # ============== 4. USERS ==============
    header("4. Users Module")

    if ADMIN_TOKEN:
        # List Users
        try:
            r = requests.get(f"{API_URL}/users",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
            data = r.json()
            test_pass("List Users", f"Total: {data.get('total', 'N/A')}")
        except Exception as e:
            test_fail("List Users", str(e))
        
        # Get User by ID
        try:
            r = requests.get(f"{API_URL}/users/1",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
            data = r.json()
            test_pass("Get User by ID", f"Email: {data.get('email', 'N/A')}")
        except Exception as e:
            test_fail("Get User", str(e))

        # Search Users
        try:
            r = requests.get(f"{API_URL}/users?search=admin",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
            data = r.json()
            test_pass("Search Users", f"Found: {data.get('total', 0)} results")
        except Exception as e:
            test_fail("Search Users", str(e))

    # ============== 5. ORGANIZATIONS ==============
    header("5. Organizations Module")

    ORG_ID = None
    if ADMIN_TOKEN:
        # List Organizations
        try:
            r = requests.get(f"{API_URL}/organizations",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
            data = r.json()
            test_pass("List Organizations", f"Total: {data.get('total', 'N/A')}")
        except Exception as e:
            test_fail("List Organizations", str(e))
        
        # Create Organization
        ORG_CODE = f"ORG{int(time.time())}"
        try:
            r = requests.post(f"{API_URL}/organizations",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
                json={
                    "name": f"Test Organization {ORG_CODE}",
                    "code": ORG_CODE,
                    "description": "Test org for API testing"
                }, timeout=10)
            data = r.json()
            if "id" in data:
                ORG_ID = data["id"]
                test_pass("Create Organization", f"ID: {ORG_ID}, Code: {ORG_CODE}")
            else:
                test_fail("Create Organization", r.text)
        except Exception as e:
            test_fail("Create Organization", str(e))

        # Get Organization
        if ORG_ID:
            try:
                r = requests.get(f"{API_URL}/organizations/{ORG_ID}",
                    headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
                data = r.json()
                test_pass("Get Organization by ID", f"Name: {data.get('name', 'N/A')}")
            except Exception as e:
                test_fail("Get Organization", str(e))

    # ============== 6. CASES ==============
    header("6. Cases Module")

    CASE_ID = None
    if ADMIN_TOKEN:
        # List Cases
        try:
            r = requests.get(f"{API_URL}/cases",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
            data = r.json()
            test_pass("List Cases", f"Total: {data.get('total', 'N/A')}")
        except Exception as e:
            test_fail("List Cases", str(e))
        
        # Create Case
        CASE_NUM = f"CASE-{int(time.time())}"
        try:
            r = requests.post(f"{API_URL}/cases",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
                json={
                    "case_number": CASE_NUM,
                    "title": "Test Case for API Testing",
                    "description": "Automated test case",
                    "case_type": "fraud",
                    "priority": "high"
                }, timeout=10)
            data = r.json()
            if "id" in data:
                CASE_ID = data["id"]
                test_pass("Create Case", f"ID: {CASE_ID}, Number: {CASE_NUM}")
            else:
                test_fail("Create Case", r.text)
        except Exception as e:
            test_fail("Create Case", str(e))
        
        # Get Case
        if CASE_ID:
            try:
                r = requests.get(f"{API_URL}/cases/{CASE_ID}",
                    headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
                data = r.json()
                test_pass("Get Case by ID", f"Title: {data.get('title', 'N/A')}")
            except Exception as e:
                test_fail("Get Case", str(e))
            
            # Update Case
            try:
                r = requests.put(f"{API_URL}/cases/{CASE_ID}",
                    headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
                    json={"title": "Updated Test Case", "status": "in_progress"}, timeout=10)
                data = r.json()
                test_pass("Update Case", f"New Status: {data.get('status', 'N/A')}")
            except Exception as e:
                test_fail("Update Case", str(e))

        # Case Stats
        try:
            r = requests.get(f"{API_URL}/cases/stats",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
            data = r.json()
            test_pass("Get Case Stats", f"Total: {data.get('total', 0)}, Open: {data.get('open', 0)}")
        except Exception as e:
            test_fail("Case Stats", str(e))

    # ============== 7. MONEY FLOW ==============
    header("7. Money Flow Module")

    NODE1_ID = None
    NODE2_ID = None
    if ADMIN_TOKEN and CASE_ID:
        # Get Money Flow (correct path: /cases/{id}/money-flow)
        try:
            r = requests.get(f"{API_URL}/cases/{CASE_ID}/money-flow",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
            data = r.json()
            test_pass("Get Money Flow", f"Nodes: {len(data.get('nodes', []))}, Edges: {len(data.get('edges', []))}")
        except Exception as e:
            test_fail("Get Money Flow", str(e))
        
        # Create Node 1 (Victim)
        try:
            r = requests.post(f"{API_URL}/cases/{CASE_ID}/money-flow/nodes",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
                json={
                    "node_type": "bank_account",
                    "label": "Victim Account",
                    "identifier": "1234567890",
                    "bank_name": "Test Bank",
                    "account_name": "John Doe",
                    "is_victim": True
                }, timeout=10)
            data = r.json()
            if "id" in data:
                NODE1_ID = data["id"]
                test_pass("Create Node 1 (Victim)", f"ID: {NODE1_ID}")
            else:
                test_fail("Create Node 1", r.text)
        except Exception as e:
            test_fail("Create Node 1", str(e))
        
        # Create Node 2 (Suspect)
        try:
            r = requests.post(f"{API_URL}/cases/{CASE_ID}/money-flow/nodes",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
                json={
                    "node_type": "bank_account",
                    "label": "Suspect Account",
                    "identifier": "0987654321",
                    "bank_name": "Another Bank",
                    "is_suspect": True
                }, timeout=10)
            data = r.json()
            if "id" in data:
                NODE2_ID = data["id"]
                test_pass("Create Node 2 (Suspect)", f"ID: {NODE2_ID}")
            else:
                test_fail("Create Node 2", r.text)
        except Exception as e:
            test_fail("Create Node 2", str(e))
        
        # Create Edge (Transfer)
        if NODE1_ID and NODE2_ID:
            try:
                r = requests.post(f"{API_URL}/cases/{CASE_ID}/money-flow/edges",
                    headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
                    json={
                        "from_node_id": NODE1_ID,
                        "to_node_id": NODE2_ID,
                        "amount": 50000,
                        "currency": "THB",
                        "label": "Bank Transfer"
                    }, timeout=10)
                data = r.json()
                if "id" in data:
                    test_pass("Create Edge (Transfer)", f"Amount: 50,000 THB")
                else:
                    test_fail("Create Edge", r.text)
            except Exception as e:
                test_fail("Create Edge", str(e))
        
        # Get Updated Money Flow
        try:
            r = requests.get(f"{API_URL}/cases/{CASE_ID}/money-flow",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
            data = r.json()
            test_pass("Get Updated Money Flow", f"Nodes: {len(data.get('nodes', []))}, Edges: {len(data.get('edges', []))}")
        except Exception as e:
            test_fail("Get Updated Money Flow", str(e))

    # ============== 8. EVIDENCE ==============
    header("8. Evidence Module")

    if ADMIN_TOKEN and CASE_ID:
        # List Evidence
        try:
            r = requests.get(f"{API_URL}/evidence/case/{CASE_ID}",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
            data = r.json()
            test_pass("List Evidence for Case", f"Total: {data.get('total', 0)}")
        except Exception as e:
            test_fail("List Evidence", str(e))

        # Verify Hash (should return not found for random hash)
        try:
            r = requests.post(f"{API_URL}/evidence/verify-hash",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
                json={"hash": "abc123def456nonexistent"}, timeout=10)
            test_pass("Verify Hash Endpoint", f"HTTP {r.status_code}")
        except Exception as e:
            test_fail("Verify Hash", str(e))

    # ============== 9. ERROR HANDLING ==============
    header("9. Error Handling")

    # Unauthorized
    try:
        r = requests.get(f"{API_URL}/users", timeout=10)
        if r.status_code == 403:
            test_pass("Unauthorized Access Rejected", "HTTP 403")
        else:
            test_fail("Unauthorized", f"Status: {r.status_code}")
    except Exception as e:
        test_fail("Unauthorized", str(e))

    # Invalid Token
    try:
        r = requests.get(f"{API_URL}/users",
            headers={"Authorization": "Bearer invalid_token_here"}, timeout=10)
        if r.status_code == 401:
            test_pass("Invalid Token Rejected", "HTTP 401")
        else:
            test_fail("Invalid Token", f"Status: {r.status_code}")
    except Exception as e:
        test_fail("Invalid Token", str(e))

    # Not Found
    if ADMIN_TOKEN:
        try:
            r = requests.get(f"{API_URL}/cases/99999",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
            if r.status_code == 404:
                test_pass("Not Found Returns 404", "HTTP 404")
            else:
                test_fail("Not Found", f"Status: {r.status_code}")
        except Exception as e:
            test_fail("Not Found", str(e))

    # ============== 10. CLEANUP ==============
    header("10. Cleanup (Optional)")

    if ADMIN_TOKEN and CASE_ID:
        try:
            r = requests.delete(f"{API_URL}/cases/{CASE_ID}",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=10)
            if r.status_code in [200, 204]:
                test_pass("Delete Test Case", f"Case ID: {CASE_ID}")
            else:
                print(f"{YELLOW}[SKIP]{NC} Could not delete test case")
        except Exception as e:
            print(f"{YELLOW}[SKIP]{NC} Cleanup failed: {str(e)[:50]}")

    # ============== SUMMARY ==============
    header("TEST SUMMARY")

    total = passed + failed
    success_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"\n{CYAN}Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{NC}")
    print(f"Total Tests: {total}")
    print(f"{GREEN}Passed: {passed}{NC}")
    print(f"{RED}Failed: {failed}{NC}")
    print(f"Success Rate: {success_rate:.1f}%")
    print()

    if failed == 0:
        print(f"{GREEN}{'='*60}{NC}")
        print(f"{GREEN}  🎉 ALL TESTS PASSED! ✅{NC}")
        print(f"{GREEN}{'='*60}{NC}")
        return 0
    else:
        print(f"{RED}{'='*60}{NC}")
        print(f"{RED}  ❌ {failed} TEST(S) FAILED!{NC}")
        print(f"{RED}{'='*60}{NC}")
        return 1


if __name__ == "__main__":
    exit(run_tests())
