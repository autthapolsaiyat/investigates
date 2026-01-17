#!/bin/bash

# ===========================================
# InvestiGate - Azure API Test Script
# ทดสอบ API บน Azure โดยตรง
# ===========================================

# Azure API URL
API_URL="https://investigates-api.azurewebsites.net/api/v1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Counters
PASS=0
FAIL=0

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🔍 InvestiGate - Azure API Test                        ║"
echo "║     API: $API_URL"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ===========================================
# Helper Functions
# ===========================================

test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${YELLOW}▶ $method $endpoint${NC}"
    echo -e "  ${description}"
    
    if [ "$method" == "GET" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint" 2>&1)
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ]; then
        echo -e "  ${GREEN}✓ Status: $HTTP_CODE${NC}"
        echo -e "  ${GREEN}Response: $(echo $BODY | head -c 200)...${NC}"
        ((PASS++))
    elif [ "$HTTP_CODE" == "000" ]; then
        echo -e "  ${RED}✗ Connection Failed - API may not be running${NC}"
        ((FAIL++))
    else
        echo -e "  ${RED}✗ Status: $HTTP_CODE${NC}"
        echo -e "  ${RED}Response: $BODY${NC}"
        ((FAIL++))
    fi
    echo ""
}

# ===========================================
# 0. CHECK API AVAILABILITY
# ===========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  0. Checking API Availability${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}▶ Checking if API is reachable...${NC}"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/../health" 2>&1)
ROOT=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL%/api/v1}/" 2>&1)

echo -e "  Health endpoint: $HEALTH"
echo -e "  Root endpoint: $ROOT"

if [ "$HEALTH" == "000" ] && [ "$ROOT" == "000" ]; then
    echo -e "${RED}"
    echo "════════════════════════════════════════════════════════════"
    echo "  ❌ Cannot connect to Azure API!"
    echo ""
    echo "  Possible issues:"
    echo "  1. Backend not deployed to Azure"
    echo "  2. Azure App Service is stopped"
    echo "  3. Wrong API URL"
    echo ""
    echo "  Current URL: $API_URL"
    echo ""
    echo "  To deploy backend:"
    echo "  1. Go to Azure Portal"
    echo "  2. Create App Service (Python 3.11)"
    echo "  3. Deploy from GitHub or VS Code"
    echo "════════════════════════════════════════════════════════════"
    echo -e "${NC}"
    exit 1
fi
echo ""

# ===========================================
# 1. PUBLIC ENDPOINTS (No Auth Required)
# ===========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  1. Public Endpoints${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

test_endpoint "GET" "/../health" "Health check"
test_endpoint "GET" "/../" "Root endpoint"
test_endpoint "GET" "/../docs" "Swagger UI"

# ===========================================
# 2. AUTH ENDPOINTS
# ===========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  2. Authentication${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Try to login
echo -e "${YELLOW}▶ POST /auth/login${NC}"
echo -e "  Attempting login..."

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"admin123"}' 2>&1)

LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$LOGIN_CODE" == "200" ]; then
    TOKEN=$(echo "$LOGIN_BODY" | jq -r '.access_token // .token' 2>/dev/null)
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo -e "  ${GREEN}✓ Login successful!${NC}"
        echo -e "  ${GREEN}Token: ${TOKEN:0:50}...${NC}"
        export AUTH_TOKEN=$TOKEN
        ((PASS++))
    else
        echo -e "  ${RED}✗ Login returned 200 but no token${NC}"
        ((FAIL++))
    fi
else
    echo -e "  ${RED}✗ Login failed: $LOGIN_CODE${NC}"
    echo -e "  ${RED}Response: $LOGIN_BODY${NC}"
    ((FAIL++))
fi
echo ""

# ===========================================
# 3. CASES API
# ===========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  3. Cases API${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Set auth header if we have token
if [ -n "$AUTH_TOKEN" ]; then
    AUTH_HEADER="-H \"Authorization: Bearer $AUTH_TOKEN\""
else
    AUTH_HEADER=""
fi

# List cases (may require auth)
echo -e "${YELLOW}▶ GET /cases${NC}"
echo -e "  List all cases"

if [ -n "$AUTH_TOKEN" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/cases?page=1&page_size=10" \
        -H "Authorization: Bearer $AUTH_TOKEN" 2>&1)
else
    RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/cases?page=1&page_size=10" 2>&1)
fi

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    COUNT=$(echo "$BODY" | jq -r '.total // (.items | length)' 2>/dev/null)
    echo -e "  ${GREEN}✓ Status: $HTTP_CODE - Found $COUNT cases${NC}"
    ((PASS++))
elif [ "$HTTP_CODE" == "403" ] || [ "$HTTP_CODE" == "401" ]; then
    echo -e "  ${YELLOW}⚠ Status: $HTTP_CODE - Auth required${NC}"
    ((FAIL++))
else
    echo -e "  ${RED}✗ Status: $HTTP_CODE${NC}"
    echo -e "  ${RED}Response: $BODY${NC}"
    ((FAIL++))
fi
echo ""

# Create case
echo -e "${YELLOW}▶ POST /cases${NC}"
echo -e "  Create new case"

CASE_DATA='{
    "title":"Test Case from Script",
    "description":"Created by Azure test script",
    "case_type":"cryptocurrency",
    "status":"investigating",
    "priority":"high",
    "total_amount":5000000
}'

if [ -n "$AUTH_TOKEN" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "$CASE_DATA" 2>&1)
else
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases" \
        -H "Content-Type: application/json" \
        -d "$CASE_DATA" 2>&1)
fi

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ]; then
    CASE_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
    echo -e "  ${GREEN}✓ Status: $HTTP_CODE - Created case ID: $CASE_ID${NC}"
    export TEST_CASE_ID=$CASE_ID
    ((PASS++))
elif [ "$HTTP_CODE" == "403" ] || [ "$HTTP_CODE" == "401" ]; then
    echo -e "  ${YELLOW}⚠ Status: $HTTP_CODE - Auth required${NC}"
    ((FAIL++))
else
    echo -e "  ${RED}✗ Status: $HTTP_CODE${NC}"
    echo -e "  ${RED}Response: $BODY${NC}"
    ((FAIL++))
fi
echo ""

# ===========================================
# 4. MONEY FLOW API
# ===========================================

if [ -n "$TEST_CASE_ID" ] && [ "$TEST_CASE_ID" != "null" ]; then
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  4. Money Flow API (Case $TEST_CASE_ID)${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    
    # Create node
    echo -e "${YELLOW}▶ POST /cases/$TEST_CASE_ID/money-flow/nodes${NC}"
    
    NODE_DATA='{
        "label":"Test Wallet",
        "node_type":"wallet",
        "amount":1000000,
        "risk_score":75
    }'
    
    if [ -n "$AUTH_TOKEN" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases/$TEST_CASE_ID/money-flow/nodes" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d "$NODE_DATA" 2>&1)
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases/$TEST_CASE_ID/money-flow/nodes" \
            -H "Content-Type: application/json" \
            -d "$NODE_DATA" 2>&1)
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ]; then
        NODE_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
        echo -e "  ${GREEN}✓ Status: $HTTP_CODE - Created node ID: $NODE_ID${NC}"
        ((PASS++))
    else
        echo -e "  ${RED}✗ Status: $HTTP_CODE${NC}"
        ((FAIL++))
    fi
    echo ""
fi

# ===========================================
# SUMMARY
# ===========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  TEST SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

TOTAL=$((PASS + FAIL))

echo -e "  Total Tests: ${CYAN}$TOTAL${NC}"
echo -e "  Passed:      ${GREEN}$PASS${NC}"
echo -e "  Failed:      ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}  ★★★ ALL TESTS PASSED! ★★★${NC}"
elif [ $PASS -gt 0 ]; then
    echo -e "${YELLOW}  Some tests passed, some failed${NC}"
else
    echo -e "${RED}  ✗ All tests failed${NC}"
    echo ""
    echo -e "${YELLOW}  Troubleshooting:${NC}"
    echo -e "  1. Check if Azure App Service is running"
    echo -e "  2. Check Azure Portal for deployment status"
    echo -e "  3. Check API logs in Azure Portal"
fi

echo ""
echo -e "${BLUE}  API URL: $API_URL${NC}"
echo -e "${BLUE}  Tested at: $(date)${NC}"
echo ""
