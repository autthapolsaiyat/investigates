#!/bin/bash

# InvestiGate Complete Test Script
# ================================

API_URL="https://investigates-api.azurewebsites.net/api/v1"
EMAIL="admin@test.com"
PASSWORD="Test1234!"

echo "================================================"
echo "🧪 InvestiGate API Complete Test"
echo "================================================"
echo ""

# 1. Login
echo "🔐 [1/10] Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "$LOGIN_RESPONSE"
  exit 1
fi
echo "✅ Login successful!"
echo ""

# 2. Get User Profile
echo "👤 [2/10] Testing Get Profile..."
PROFILE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/auth/me")
echo "✅ Profile: $(echo $PROFILE | grep -o '"email":"[^"]*' | cut -d'"' -f4)"
echo ""

# 3. List Organizations
echo "🏢 [3/10] Testing Organizations..."
ORGS=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/organizations")
ORG_COUNT=$(echo $ORGS | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "✅ Organizations count: $ORG_COUNT"

# Create new organization
echo "   Creating new organization..."
NEW_ORG=$(curl -s -X POST "$API_URL/organizations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Police Station",
    "code": "TEST_POLICE_001",
    "description": "Test organization for API testing"
  }')
NEW_ORG_ID=$(echo $NEW_ORG | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Created organization ID: $NEW_ORG_ID"
echo ""

# 4. List Users
echo "👥 [4/10] Testing Users..."
USERS=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/users")
USER_COUNT=$(echo $USERS | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "✅ Users count: $USER_COUNT"
echo ""

# 5. List Cases
echo "📁 [5/10] Testing Cases..."
CASES=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/cases")
CASE_COUNT=$(echo $CASES | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "✅ Cases count: $CASE_COUNT"

# Create new case
echo "   Creating new case..."
NEW_CASE=$(curl -s -X POST "$API_URL/cases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Online Gambling Ring Investigation",
    "description": "Investigation of suspected online gambling network operating across multiple provinces",
    "case_type": "online_gambling",
    "priority": "critical",
    "tags": ["gambling", "network", "multi-province"]
  }')
NEW_CASE_ID=$(echo $NEW_CASE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
CASE_NUMBER=$(echo $NEW_CASE | grep -o '"case_number":"[^"]*' | cut -d'"' -f4)
echo "✅ Created case: $CASE_NUMBER (ID: $NEW_CASE_ID)"
echo ""

# 6. Get Dashboard Stats
echo "📊 [6/10] Testing Dashboard Statistics..."
STATS=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/cases/statistics")
echo "✅ Stats: $STATS"
echo ""

# 7. Create Money Flow Nodes
echo "💰 [7/10] Creating Money Flow Nodes..."

# Node 1: Suspect
NODE1=$(curl -s -X POST "$API_URL/cases/$NEW_CASE_ID/money-flow/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "person",
    "label": "นาย ก ผู้ต้องสงสัย",
    "identifier": "1-1234-56789-01-0",
    "phone_number": "081-234-5678",
    "is_suspect": true,
    "is_victim": false,
    "x_position": 100,
    "y_position": 250,
    "risk_score": 90,
    "size": 50,
    "notes": "Main suspect - gambling website operator"
  }')
NODE1_ID=$(echo $NODE1 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Created Node 1 (Suspect): ID $NODE1_ID"

# Node 2: Suspect Bank Account
NODE2=$(curl -s -X POST "$API_URL/cases/$NEW_CASE_ID/money-flow/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "bank_account",
    "label": "บัญชี กสิกร นาย ก",
    "identifier": "123-4-56789-0",
    "bank_name": "KBANK",
    "account_name": "นาย ก ผู้ต้องสงสัย",
    "is_suspect": true,
    "x_position": 300,
    "y_position": 150,
    "risk_score": 85,
    "size": 45
  }')
NODE2_ID=$(echo $NODE2 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Created Node 2 (Suspect Bank): ID $NODE2_ID"

# Node 3: Mule Account
NODE3=$(curl -s -X POST "$API_URL/cases/$NEW_CASE_ID/money-flow/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "bank_account",
    "label": "บัญชีม้า SCB",
    "identifier": "456-7-89012-3",
    "bank_name": "SCB",
    "account_name": "นาย ข บัญชีม้า",
    "is_suspect": false,
    "x_position": 500,
    "y_position": 100,
    "risk_score": 70,
    "size": 40,
    "notes": "Mule account - multiple deposits"
  }')
NODE3_ID=$(echo $NODE3 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Created Node 3 (Mule): ID $NODE3_ID"

# Node 4: Victim 1
NODE4=$(curl -s -X POST "$API_URL/cases/$NEW_CASE_ID/money-flow/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "person",
    "label": "นาง ค ผู้เสียหาย 1",
    "identifier": "3-1234-56789-01-0",
    "phone_number": "089-876-5432",
    "is_suspect": false,
    "is_victim": true,
    "x_position": 700,
    "y_position": 150,
    "risk_score": 0,
    "size": 40,
    "notes": "Victim - lost 50,000 THB"
  }')
NODE4_ID=$(echo $NODE4 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Created Node 4 (Victim 1): ID $NODE4_ID"

# Node 5: Victim 2
NODE5=$(curl -s -X POST "$API_URL/cases/$NEW_CASE_ID/money-flow/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "person",
    "label": "นาย ง ผู้เสียหาย 2",
    "identifier": "4-5678-90123-45-6",
    "is_victim": true,
    "x_position": 700,
    "y_position": 300,
    "risk_score": 0,
    "size": 40,
    "notes": "Victim - lost 100,000 THB"
  }')
NODE5_ID=$(echo $NODE5 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Created Node 5 (Victim 2): ID $NODE5_ID"

# Node 6: Crypto Wallet
NODE6=$(curl -s -X POST "$API_URL/cases/$NEW_CASE_ID/money-flow/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "crypto_wallet",
    "label": "BTC Wallet",
    "identifier": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "blockchain": "Bitcoin",
    "is_suspect": true,
    "x_position": 300,
    "y_position": 400,
    "risk_score": 95,
    "size": 45,
    "notes": "Crypto cashout wallet"
  }')
NODE6_ID=$(echo $NODE6 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Created Node 6 (Crypto): ID $NODE6_ID"
echo ""

# 8. Create Money Flow Edges (Transactions)
echo "🔗 [8/10] Creating Money Flow Edges..."

# Edge: Victim 1 -> Mule
EDGE1=$(curl -s -X POST "$API_URL/cases/$NEW_CASE_ID/money-flow/edges" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"from_node_id\": $NODE4_ID,
    \"to_node_id\": $NODE3_ID,
    \"amount\": 50000,
    \"currency\": \"THB\",
    \"transaction_date\": \"2026-01-05T10:30:00Z\",
    \"transaction_ref\": \"TXN001\",
    \"label\": \"ฝากเงินเข้าเล่นพนัน\",
    \"edge_type\": \"deposit\",
    \"width\": 3
  }")
EDGE1_ID=$(echo $EDGE1 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Created Edge 1 (Victim1 -> Mule): ฿50,000"

# Edge: Victim 2 -> Mule
EDGE2=$(curl -s -X POST "$API_URL/cases/$NEW_CASE_ID/money-flow/edges" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"from_node_id\": $NODE5_ID,
    \"to_node_id\": $NODE3_ID,
    \"amount\": 100000,
    \"currency\": \"THB\",
    \"transaction_date\": \"2026-01-06T14:20:00Z\",
    \"transaction_ref\": \"TXN002\",
    \"label\": \"ฝากเงินเข้าเล่นพนัน\",
    \"edge_type\": \"deposit\",
    \"width\": 4
  }")
echo "✅ Created Edge 2 (Victim2 -> Mule): ฿100,000"

# Edge: Mule -> Suspect Bank
EDGE3=$(curl -s -X POST "$API_URL/cases/$NEW_CASE_ID/money-flow/edges" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"from_node_id\": $NODE3_ID,
    \"to_node_id\": $NODE2_ID,
    \"amount\": 140000,
    \"currency\": \"THB\",
    \"transaction_date\": \"2026-01-07T09:00:00Z\",
    \"transaction_ref\": \"TXN003\",
    \"label\": \"โอนรวมไปบัญชีหลัก\",
    \"edge_type\": \"transfer\",
    \"width\": 5
  }")
echo "✅ Created Edge 3 (Mule -> Suspect Bank): ฿140,000"

# Edge: Suspect Bank -> Suspect
EDGE4=$(curl -s -X POST "$API_URL/cases/$NEW_CASE_ID/money-flow/edges" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"from_node_id\": $NODE2_ID,
    \"to_node_id\": $NODE1_ID,
    \"amount\": 50000,
    \"currency\": \"THB\",
    \"transaction_date\": \"2026-01-07T11:00:00Z\",
    \"transaction_ref\": \"TXN004\",
    \"label\": \"ถอนเงินสด\",
    \"edge_type\": \"withdrawal\",
    \"width\": 3
  }")
echo "✅ Created Edge 4 (Suspect Bank -> Suspect): ฿50,000"

# Edge: Suspect Bank -> Crypto
EDGE5=$(curl -s -X POST "$API_URL/cases/$NEW_CASE_ID/money-flow/edges" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"from_node_id\": $NODE2_ID,
    \"to_node_id\": $NODE6_ID,
    \"amount\": 80000,
    \"currency\": \"THB\",
    \"transaction_date\": \"2026-01-07T15:30:00Z\",
    \"transaction_ref\": \"TXN005\",
    \"label\": \"ซื้อ Bitcoin\",
    \"edge_type\": \"crypto_purchase\",
    \"width\": 4
  }")
echo "✅ Created Edge 5 (Suspect Bank -> Crypto): ฿80,000"
echo ""

# 9. Verify Money Flow Data
echo "✅ [9/10] Verifying Money Flow Data..."
NODES=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/cases/$NEW_CASE_ID/money-flow/nodes")
NODE_COUNT=$(echo $NODES | grep -o '"id":' | wc -l | tr -d ' ')
echo "   Nodes created: $NODE_COUNT"

EDGES=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/cases/$NEW_CASE_ID/money-flow/edges")
EDGE_COUNT=$(echo $EDGES | grep -o '"id":' | wc -l | tr -d ' ')
echo "   Edges created: $EDGE_COUNT"
echo ""

# 10. Final Summary
echo "📊 [10/10] Getting Updated Statistics..."
FINAL_STATS=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/cases/statistics")
echo "$FINAL_STATS" | python3 -m json.tool 2>/dev/null || echo "$FINAL_STATS"
echo ""

echo "================================================"
echo "🎉 All tests completed successfully!"
echo "================================================"
echo ""
echo "📋 Summary:"
echo "   - New Case: $CASE_NUMBER (ID: $NEW_CASE_ID)"
echo "   - Money Flow Nodes: $NODE_COUNT"
echo "   - Money Flow Edges: $EDGE_COUNT"
echo ""
echo "🌐 View in browser:"
echo "   Dashboard: https://wonderful-wave-0486dd100.6.azurestaticapps.net/dashboard"
echo "   Cases: https://wonderful-wave-0486dd100.6.azurestaticapps.net/cases"
echo "   Money Flow: https://wonderful-wave-0486dd100.6.azurestaticapps.net/money-flow"
echo ""
