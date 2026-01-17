#!/bin/bash

# ===========================================
# InvestiGate API Test Script
# ทดสอบทุก endpoint และจำลองข้อมูล
# ===========================================

# Default to local, can override with: API_URL=xxx ./test-api.sh
API_URL="${API_URL:-http://localhost:8000/api/v1}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0

# ===========================================
# Helper Functions
# ===========================================

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_test() {
    echo -e "${YELLOW}▶ Testing: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✓ PASS: $1${NC}"
    ((PASS++))
}

print_fail() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    echo -e "${RED}  Response: $2${NC}"
    ((FAIL++))
}

# ===========================================
# 1. CASES API
# ===========================================

test_cases_api() {
    print_header "1. CASES API"
    
    # 1.1 List Cases
    print_test "GET /cases - List all cases"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/cases?page=1&page_size=10")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        COUNT=$(echo "$BODY" | jq -r '.total // .items | length' 2>/dev/null)
        print_pass "Listed cases (Total: $COUNT)"
    else
        print_fail "List cases" "$HTTP_CODE - $BODY"
    fi
    
    # 1.2 Create Case
    print_test "POST /cases - Create new case"
    NEW_CASE=$(cat <<EOF
{
    "title": "ทดสอบคดี API - $(date +%H%M%S)",
    "description": "สร้างจาก test script",
    "case_type": "cryptocurrency",
    "status": "investigating",
    "priority": "high",
    "total_amount": 5000000,
    "tags": "test,api,script"
}
EOF
)
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases" \
        -H "Content-Type: application/json" \
        -d "$NEW_CASE")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        CASE_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
        print_pass "Created case ID: $CASE_ID"
        export TEST_CASE_ID=$CASE_ID
    else
        print_fail "Create case" "$HTTP_CODE - $BODY"
        # Try to get an existing case for further tests
        CASE_ID=$(curl -s "$API_URL/cases?page=1&page_size=1" | jq -r '.items[0].id' 2>/dev/null)
        export TEST_CASE_ID=$CASE_ID
    fi
    
    # 1.3 Get Single Case
    if [ -n "$TEST_CASE_ID" ] && [ "$TEST_CASE_ID" != "null" ]; then
        print_test "GET /cases/$TEST_CASE_ID - Get single case"
        RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/cases/$TEST_CASE_ID")
        HTTP_CODE=$(echo "$RESPONSE" | tail -1)
        BODY=$(echo "$RESPONSE" | sed '$d')
        
        if [ "$HTTP_CODE" -eq 200 ]; then
            TITLE=$(echo "$BODY" | jq -r '.title' 2>/dev/null)
            print_pass "Got case: $TITLE"
        else
            print_fail "Get case" "$HTTP_CODE"
        fi
        
        # 1.4 Update Case
        print_test "PUT /cases/$TEST_CASE_ID - Update case"
        UPDATE_CASE=$(cat <<EOF
{
    "title": "คดีที่แก้ไขแล้ว - $(date +%H%M%S)",
    "status": "analyzing",
    "progress": 50
}
EOF
)
        RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/cases/$TEST_CASE_ID" \
            -H "Content-Type: application/json" \
            -d "$UPDATE_CASE")
        HTTP_CODE=$(echo "$RESPONSE" | tail -1)
        
        if [ "$HTTP_CODE" -eq 200 ]; then
            print_pass "Updated case"
        else
            print_fail "Update case" "$HTTP_CODE"
        fi
    fi
}

# ===========================================
# 2. MONEY FLOW API - NODES
# ===========================================

test_money_flow_nodes() {
    print_header "2. MONEY FLOW - NODES"
    
    if [ -z "$TEST_CASE_ID" ] || [ "$TEST_CASE_ID" == "null" ]; then
        echo -e "${YELLOW}⚠ No case ID, skipping node tests${NC}"
        return
    fi
    
    # 2.1 Create Node - Wallet
    print_test "POST /cases/$TEST_CASE_ID/nodes - Create wallet node"
    NODE1=$(cat <<EOF
{
    "label": "กระเป๋า Binance ผู้ต้องสงสัย",
    "node_type": "wallet",
    "amount": 1500000,
    "currency": "THB",
    "risk_score": 85,
    "metadata": {
        "wallet_address": "0x1234567890abcdef",
        "exchange": "Binance"
    }
}
EOF
)
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases/$TEST_CASE_ID/nodes" \
        -H "Content-Type: application/json" \
        -d "$NODE1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        NODE1_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
        print_pass "Created wallet node ID: $NODE1_ID"
        export TEST_NODE1_ID=$NODE1_ID
    else
        print_fail "Create wallet node" "$HTTP_CODE - $BODY"
    fi
    
    # 2.2 Create Node - Person
    print_test "POST /cases/$TEST_CASE_ID/nodes - Create person node"
    NODE2=$(cat <<EOF
{
    "label": "นาย ก ผู้ต้องหา",
    "node_type": "person",
    "amount": 0,
    "currency": "THB",
    "risk_score": 95,
    "metadata": {
        "id_card": "1234567890123",
        "role": "suspect"
    }
}
EOF
)
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases/$TEST_CASE_ID/nodes" \
        -H "Content-Type: application/json" \
        -d "$NODE2")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        NODE2_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
        print_pass "Created person node ID: $NODE2_ID"
        export TEST_NODE2_ID=$NODE2_ID
    else
        print_fail "Create person node" "$HTTP_CODE - $BODY"
    fi
    
    # 2.3 Create Node - Bank Account
    print_test "POST /cases/$TEST_CASE_ID/nodes - Create bank account node"
    NODE3=$(cat <<EOF
{
    "label": "บัญชี SCB 123-456-7890",
    "node_type": "bank_account",
    "amount": 2500000,
    "currency": "THB",
    "risk_score": 70,
    "metadata": {
        "bank": "SCB",
        "account_number": "123-456-7890"
    }
}
EOF
)
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases/$TEST_CASE_ID/nodes" \
        -H "Content-Type: application/json" \
        -d "$NODE3")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        NODE3_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
        print_pass "Created bank account node ID: $NODE3_ID"
        export TEST_NODE3_ID=$NODE3_ID
    else
        print_fail "Create bank account node" "$HTTP_CODE - $BODY"
    fi
    
    # 2.4 List Nodes
    print_test "GET /cases/$TEST_CASE_ID/nodes - List all nodes"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/cases/$TEST_CASE_ID/nodes")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        COUNT=$(echo "$BODY" | jq 'length' 2>/dev/null)
        print_pass "Listed $COUNT nodes"
    else
        print_fail "List nodes" "$HTTP_CODE"
    fi
}

# ===========================================
# 3. MONEY FLOW API - EDGES
# ===========================================

test_money_flow_edges() {
    print_header "3. MONEY FLOW - EDGES"
    
    if [ -z "$TEST_NODE1_ID" ] || [ -z "$TEST_NODE2_ID" ]; then
        echo -e "${YELLOW}⚠ No node IDs, skipping edge tests${NC}"
        return
    fi
    
    # 3.1 Create Edge - Person to Wallet
    print_test "POST /cases/$TEST_CASE_ID/edges - Create edge (Person → Wallet)"
    EDGE1=$(cat <<EOF
{
    "source_id": $TEST_NODE2_ID,
    "target_id": $TEST_NODE1_ID,
    "amount": 500000,
    "currency": "THB",
    "transaction_type": "transfer",
    "label": "โอนเงินครั้งที่ 1",
    "transaction_date": "2026-01-15T10:30:00Z"
}
EOF
)
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases/$TEST_CASE_ID/edges" \
        -H "Content-Type: application/json" \
        -d "$EDGE1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        EDGE1_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
        print_pass "Created edge ID: $EDGE1_ID"
    else
        print_fail "Create edge" "$HTTP_CODE - $BODY"
    fi
    
    # 3.2 Create Edge - Wallet to Bank
    if [ -n "$TEST_NODE3_ID" ]; then
        print_test "POST /cases/$TEST_CASE_ID/edges - Create edge (Wallet → Bank)"
        EDGE2=$(cat <<EOF
{
    "source_id": $TEST_NODE1_ID,
    "target_id": $TEST_NODE3_ID,
    "amount": 300000,
    "currency": "THB",
    "transaction_type": "withdrawal",
    "label": "ถอนเงินไปบัญชีธนาคาร",
    "transaction_date": "2026-01-16T14:00:00Z"
}
EOF
)
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases/$TEST_CASE_ID/edges" \
            -H "Content-Type: application/json" \
            -d "$EDGE2")
        HTTP_CODE=$(echo "$RESPONSE" | tail -1)
        
        if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
            print_pass "Created withdrawal edge"
        else
            print_fail "Create withdrawal edge" "$HTTP_CODE"
        fi
    fi
    
    # 3.3 List Edges
    print_test "GET /cases/$TEST_CASE_ID/edges - List all edges"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/cases/$TEST_CASE_ID/edges")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        COUNT=$(echo "$BODY" | jq 'length' 2>/dev/null)
        print_pass "Listed $COUNT edges"
    else
        print_fail "List edges" "$HTTP_CODE"
    fi
}

# ===========================================
# 4. CREATE DEMO CASES
# ===========================================

create_demo_cases() {
    print_header "4. CREATE DEMO CASES"
    
    # Demo Case 1: Crypto Fraud
    print_test "Creating Demo Case 1: คดี Crypto Fraud"
    DEMO1=$(cat <<EOF
{
    "title": "คดีหลอกลงทุน Bitcoin ผ่าน Line",
    "description": "ผู้เสียหายถูกชักชวนให้ลงทุน Bitcoin ผ่านกลุ่ม Line โดยสัญญาผลตอบแทน 30% ต่อเดือน",
    "case_type": "cryptocurrency",
    "status": "investigating",
    "priority": "high",
    "total_amount": 15000000,
    "tags": "bitcoin,line,investment-fraud"
}
EOF
)
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases" \
        -H "Content-Type: application/json" \
        -d "$DEMO1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        DEMO1_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
        print_pass "Created Demo Case 1, ID: $DEMO1_ID"
        
        # Add nodes for Demo 1
        curl -s -X POST "$API_URL/cases/$DEMO1_ID/nodes" \
            -H "Content-Type: application/json" \
            -d '{"label":"ผู้ต้องหา A","node_type":"person","risk_score":90}' > /dev/null
        curl -s -X POST "$API_URL/cases/$DEMO1_ID/nodes" \
            -H "Content-Type: application/json" \
            -d '{"label":"Wallet Binance","node_type":"wallet","amount":5000000,"risk_score":85}' > /dev/null
        curl -s -X POST "$API_URL/cases/$DEMO1_ID/nodes" \
            -H "Content-Type: application/json" \
            -d '{"label":"บัญชี KBank","node_type":"bank_account","amount":10000000,"risk_score":75}' > /dev/null
        echo -e "${GREEN}  → Added 3 nodes${NC}"
    else
        print_fail "Create Demo Case 1" "$HTTP_CODE"
    fi
    
    # Demo Case 2: Money Laundering
    print_test "Creating Demo Case 2: คดีฟอกเงิน"
    DEMO2=$(cat <<EOF
{
    "title": "คดีฟอกเงินผ่านธุรกิจร้านอาหาร",
    "description": "ตรวจพบการหมุนเวียนเงินผิดปกติผ่านร้านอาหาร 5 สาขา",
    "case_type": "money_laundering",
    "status": "analyzing",
    "priority": "critical",
    "total_amount": 50000000,
    "tags": "money-laundering,restaurant,cash"
}
EOF
)
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases" \
        -H "Content-Type: application/json" \
        -d "$DEMO2")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        DEMO2_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
        print_pass "Created Demo Case 2, ID: $DEMO2_ID"
        
        # Add nodes for Demo 2
        curl -s -X POST "$API_URL/cases/$DEMO2_ID/nodes" \
            -H "Content-Type: application/json" \
            -d '{"label":"บริษัท ABC","node_type":"company","risk_score":95}' > /dev/null
        curl -s -X POST "$API_URL/cases/$DEMO2_ID/nodes" \
            -H "Content-Type: application/json" \
            -d '{"label":"ร้านอาหาร สาขา 1","node_type":"business","amount":8000000}' > /dev/null
        curl -s -X POST "$API_URL/cases/$DEMO2_ID/nodes" \
            -H "Content-Type: application/json" \
            -d '{"label":"ร้านอาหาร สาขา 2","node_type":"business","amount":12000000}' > /dev/null
        curl -s -X POST "$API_URL/cases/$DEMO2_ID/nodes" \
            -H "Content-Type: application/json" \
            -d '{"label":"บัญชี SCB","node_type":"bank_account","amount":30000000}' > /dev/null
        echo -e "${GREEN}  → Added 4 nodes${NC}"
    else
        print_fail "Create Demo Case 2" "$HTTP_CODE"
    fi
    
    # Demo Case 3: Online Gambling
    print_test "Creating Demo Case 3: คดีพนันออนไลน์"
    DEMO3=$(cat <<EOF
{
    "title": "คดีเครือข่ายพนันออนไลน์ข้ามชาติ",
    "description": "เครือข่ายพนันออนไลน์ที่มีเซิร์ฟเวอร์ในต่างประเทศ รับเงินผ่าน Crypto",
    "case_type": "online_gambling",
    "status": "investigating",
    "priority": "high",
    "total_amount": 100000000,
    "tags": "gambling,online,international,crypto"
}
EOF
)
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases" \
        -H "Content-Type: application/json" \
        -d "$DEMO3")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        DEMO3_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
        print_pass "Created Demo Case 3, ID: $DEMO3_ID"
        
        # Add nodes for Demo 3
        curl -s -X POST "$API_URL/cases/$DEMO3_ID/nodes" \
            -H "Content-Type: application/json" \
            -d '{"label":"เว็บพนัน ABC","node_type":"website","risk_score":100}' > /dev/null
        curl -s -X POST "$API_URL/cases/$DEMO3_ID/nodes" \
            -H "Content-Type: application/json" \
            -d '{"label":"Wallet USDT","node_type":"wallet","amount":50000000,"risk_score":95}' > /dev/null
        curl -s -X POST "$API_URL/cases/$DEMO3_ID/nodes" \
            -H "Content-Type: application/json" \
            -d '{"label":"Agent 1","node_type":"person","risk_score":80}' > /dev/null
        curl -s -X POST "$API_URL/cases/$DEMO3_ID/nodes" \
            -H "Content-Type: application/json" \
            -d '{"label":"Agent 2","node_type":"person","risk_score":80}' > /dev/null
        curl -s -X POST "$API_URL/cases/$DEMO3_ID/nodes" \
            -H "Content-Type: application/json" \
            -d '{"label":"บัญชี BBL","node_type":"bank_account","amount":25000000}' > /dev/null
        echo -e "${GREEN}  → Added 5 nodes${NC}"
    else
        print_fail "Create Demo Case 3" "$HTTP_CODE"
    fi
}

# ===========================================
# 5. AUTH API (if exists)
# ===========================================

test_auth_api() {
    print_header "5. AUTH API"
    
    # 5.1 Login
    print_test "POST /auth/login - Login"
    LOGIN=$(cat <<EOF
{
    "email": "admin@test.com",
    "password": "admin123"
}
EOF
)
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "$LOGIN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        TOKEN=$(echo "$BODY" | jq -r '.token // .access_token' 2>/dev/null)
        print_pass "Login successful"
    else
        print_fail "Login" "$HTTP_CODE - (may not be implemented)"
    fi
}

# ===========================================
# 6. SUMMARY
# ===========================================

print_summary() {
    print_header "TEST SUMMARY"
    
    TOTAL=$((PASS + FAIL))
    
    echo ""
    echo -e "Total Tests: ${BLUE}$TOTAL${NC}"
    echo -e "Passed:      ${GREEN}$PASS${NC}"
    echo -e "Failed:      ${RED}$FAIL${NC}"
    echo ""
    
    if [ $FAIL -eq 0 ]; then
        echo -e "${GREEN}★★★ ALL TESTS PASSED! ★★★${NC}"
    else
        echo -e "${YELLOW}Some tests failed. Check the logs above.${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}API URL: $API_URL${NC}"
    echo -e "${BLUE}Test completed at: $(date)${NC}"
}

# ===========================================
# MAIN
# ===========================================

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     InvestiGate API Test Suite            ║${NC}"
echo -e "${BLUE}║     Testing: $API_URL${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required. Install with: brew install jq${NC}"
    exit 1
fi

# Run tests
test_cases_api
test_money_flow_nodes
test_money_flow_edges
create_demo_cases
test_auth_api

# Print summary
print_summary
