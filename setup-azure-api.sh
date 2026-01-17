#!/bin/bash

# ===========================================
# InvestiGate - Azure API Setup & Test
# Register user, login, create demo data
# ===========================================

API_URL="https://investigates-api.azurewebsites.net/api/v1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🔍 InvestiGate - Azure API Setup                       ║"
echo "║     API: $API_URL"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ===========================================
# 1. CHECK API ENDPOINTS
# ===========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  1. Finding API Endpoints${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Test different paths
echo -e "${YELLOW}Testing endpoints...${NC}"

# Test root
ROOT_RESPONSE=$(curl -s "https://investigates-api.azurewebsites.net/" 2>&1)
echo -e "Root: $ROOT_RESPONSE"

# Test /api/v1
API_V1=$(curl -s "$API_URL" 2>&1)
echo -e "API v1: $API_V1"

# Test docs
DOCS=$(curl -s -o /dev/null -w "%{http_code}" "https://investigates-api.azurewebsites.net/docs" 2>&1)
echo -e "Docs at /docs: $DOCS"

DOCS_API=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/docs" 2>&1)
echo -e "Docs at /api/v1/docs: $DOCS_API"

echo ""

# ===========================================
# 2. REGISTER USER
# ===========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  2. Register Admin User${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}▶ POST /auth/register${NC}"

REGISTER_DATA='{
    "email": "admin@test.com",
    "password": "admin123",
    "first_name": "Admin",
    "last_name": "User",
    "role": "super_admin"
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "  Status: $HTTP_CODE"
echo -e "  Response: $BODY"

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ]; then
    echo -e "  ${GREEN}✓ User registered successfully${NC}"
elif [ "$HTTP_CODE" == "400" ] && [[ "$BODY" == *"already"* ]]; then
    echo -e "  ${YELLOW}⚠ User already exists${NC}"
else
    echo -e "  ${RED}✗ Registration failed${NC}"
fi
echo ""

# ===========================================
# 3. LOGIN
# ===========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  3. Login${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}▶ POST /auth/login${NC}"

# Try different login formats
LOGIN_JSON='{"email":"admin@test.com","password":"admin123"}'
LOGIN_FORM="username=admin@test.com&password=admin123"

# Try JSON format first
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_JSON" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "  JSON format - Status: $HTTP_CODE"

if [ "$HTTP_CODE" != "200" ]; then
    # Try form format (OAuth2)
    echo -e "  Trying form format..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "$LOGIN_FORM" 2>&1)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    echo -e "  Form format - Status: $HTTP_CODE"
fi

if [ "$HTTP_CODE" == "200" ]; then
    TOKEN=$(echo "$BODY" | jq -r '.access_token // .token' 2>/dev/null)
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo -e "  ${GREEN}✓ Login successful!${NC}"
        echo -e "  ${GREEN}Token: ${TOKEN:0:50}...${NC}"
        export AUTH_TOKEN=$TOKEN
    else
        echo -e "  ${YELLOW}Response: $BODY${NC}"
    fi
else
    echo -e "  ${RED}✗ Login failed: $BODY${NC}"
fi
echo ""

# ===========================================
# 4. CREATE ORGANIZATION
# ===========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  4. Create Organization${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

if [ -n "$AUTH_TOKEN" ]; then
    echo -e "${YELLOW}▶ POST /organizations${NC}"
    
    ORG_DATA='{
        "name": "กองบังคับการปราบปรามอาชญากรรมทางเศรษฐกิจ",
        "code": "ECD",
        "description": "Economic Crime Division"
    }'
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/organizations" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "$ORG_DATA" 2>&1)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    echo -e "  Status: $HTTP_CODE"
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ]; then
        ORG_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
        echo -e "  ${GREEN}✓ Organization created: ID $ORG_ID${NC}"
    else
        echo -e "  Response: $BODY"
    fi
else
    echo -e "  ${YELLOW}Skipping - No auth token${NC}"
fi
echo ""

# ===========================================
# 5. CREATE DEMO CASES
# ===========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  5. Create Demo Cases${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

if [ -n "$AUTH_TOKEN" ]; then
    # Case 1: Crypto Fraud
    echo -e "${YELLOW}▶ Creating Case 1: คดีหลอกลงทุน Bitcoin${NC}"
    
    CASE1='{
        "title": "คดีหลอกลงทุน Bitcoin ผ่าน Line",
        "description": "ผู้เสียหายถูกชักชวนลงทุน Bitcoin โดยสัญญาผลตอบแทน 30% ต่อเดือน",
        "case_type": "cryptocurrency",
        "status": "investigating",
        "priority": "high",
        "total_amount": 15000000,
        "tags": "bitcoin,line,fraud"
    }'
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "$CASE1" 2>&1)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ]; then
        CASE1_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
        echo -e "  ${GREEN}✓ Created Case 1: ID $CASE1_ID${NC}"
        
        # Add nodes
        echo -e "  Adding nodes..."
        curl -s -X POST "$API_URL/cases/$CASE1_ID/money-flow/nodes" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d '{"label":"ผู้ต้องหา นาย ก","node_type":"person","risk_score":95}' > /dev/null
        curl -s -X POST "$API_URL/cases/$CASE1_ID/money-flow/nodes" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d '{"label":"Wallet Binance","node_type":"wallet","amount":5000000,"risk_score":85}' > /dev/null
        curl -s -X POST "$API_URL/cases/$CASE1_ID/money-flow/nodes" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d '{"label":"บัญชี KBank","node_type":"bank_account","amount":10000000}' > /dev/null
        echo -e "  ${GREEN}✓ Added 3 nodes${NC}"
    else
        echo -e "  ${RED}✗ Failed: $HTTP_CODE - $BODY${NC}"
    fi
    echo ""
    
    # Case 2: Money Laundering
    echo -e "${YELLOW}▶ Creating Case 2: คดีฟอกเงิน${NC}"
    
    CASE2='{
        "title": "คดีฟอกเงินผ่านธุรกิจร้านอาหาร",
        "description": "ตรวจพบการหมุนเวียนเงินผิดปกติผ่านร้านอาหาร 5 สาขา",
        "case_type": "money_laundering",
        "status": "analyzing",
        "priority": "critical",
        "total_amount": 50000000,
        "tags": "money-laundering,restaurant"
    }'
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "$CASE2" 2>&1)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ]; then
        CASE2_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
        echo -e "  ${GREEN}✓ Created Case 2: ID $CASE2_ID${NC}"
        
        # Add nodes
        echo -e "  Adding nodes..."
        curl -s -X POST "$API_URL/cases/$CASE2_ID/money-flow/nodes" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d '{"label":"บริษัท ABC","node_type":"company","risk_score":95}' > /dev/null
        curl -s -X POST "$API_URL/cases/$CASE2_ID/money-flow/nodes" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d '{"label":"ร้านอาหาร สาขา 1","node_type":"business","amount":15000000}' > /dev/null
        curl -s -X POST "$API_URL/cases/$CASE2_ID/money-flow/nodes" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d '{"label":"ร้านอาหาร สาขา 2","node_type":"business","amount":20000000}' > /dev/null
        curl -s -X POST "$API_URL/cases/$CASE2_ID/money-flow/nodes" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d '{"label":"บัญชี SCB","node_type":"bank_account","amount":35000000}' > /dev/null
        echo -e "  ${GREEN}✓ Added 4 nodes${NC}"
    else
        echo -e "  ${RED}✗ Failed: $HTTP_CODE - $BODY${NC}"
    fi
    echo ""
    
    # Case 3: Online Gambling
    echo -e "${YELLOW}▶ Creating Case 3: คดีพนันออนไลน์${NC}"
    
    CASE3='{
        "title": "คดีเครือข่ายพนันออนไลน์ข้ามชาติ",
        "description": "เครือข่ายพนันออนไลน์รับเงินผ่าน Crypto",
        "case_type": "online_gambling",
        "status": "investigating",
        "priority": "high",
        "total_amount": 100000000,
        "tags": "gambling,crypto,international"
    }'
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cases" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "$CASE3" 2>&1)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "201" ]; then
        CASE3_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
        echo -e "  ${GREEN}✓ Created Case 3: ID $CASE3_ID${NC}"
        
        # Add nodes
        echo -e "  Adding nodes..."
        curl -s -X POST "$API_URL/cases/$CASE3_ID/money-flow/nodes" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d '{"label":"เว็บพนัน ABC","node_type":"website","risk_score":100}' > /dev/null
        curl -s -X POST "$API_URL/cases/$CASE3_ID/money-flow/nodes" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d '{"label":"Wallet USDT","node_type":"wallet","amount":50000000,"risk_score":95}' > /dev/null
        curl -s -X POST "$API_URL/cases/$CASE3_ID/money-flow/nodes" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d '{"label":"Agent 1","node_type":"person","risk_score":80}' > /dev/null
        curl -s -X POST "$API_URL/cases/$CASE3_ID/money-flow/nodes" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d '{"label":"Agent 2","node_type":"person","risk_score":80}' > /dev/null
        curl -s -X POST "$API_URL/cases/$CASE3_ID/money-flow/nodes" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d '{"label":"บัญชี BBL","node_type":"bank_account","amount":30000000}' > /dev/null
        echo -e "  ${GREEN}✓ Added 5 nodes${NC}"
    else
        echo -e "  ${RED}✗ Failed: $HTTP_CODE - $BODY${NC}"
    fi
else
    echo -e "  ${YELLOW}Skipping - No auth token${NC}"
fi
echo ""

# ===========================================
# 6. VERIFY DATA
# ===========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  6. Verify Created Data${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

if [ -n "$AUTH_TOKEN" ]; then
    echo -e "${YELLOW}▶ GET /cases${NC}"
    
    RESPONSE=$(curl -s "$API_URL/cases?page=1&page_size=10" \
        -H "Authorization: Bearer $AUTH_TOKEN" 2>&1)
    
    TOTAL=$(echo "$RESPONSE" | jq -r '.total // (.items | length)' 2>/dev/null)
    echo -e "  ${GREEN}Total cases in database: $TOTAL${NC}"
    
    # List cases
    echo "$RESPONSE" | jq -r '.items[]? | "  - \(.id): \(.title) (\(.status))"' 2>/dev/null
else
    echo -e "  ${YELLOW}Skipping - No auth token${NC}"
fi
echo ""

# ===========================================
# SUMMARY
# ===========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  SETUP COMPLETE${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

if [ -n "$AUTH_TOKEN" ]; then
    echo -e "${GREEN}  ✓ User registered/logged in${NC}"
    echo -e "${GREEN}  ✓ Demo data created${NC}"
    echo ""
    echo -e "${CYAN}  Now test the frontend:${NC}"
    echo -e "  https://wonderful-wave-0486dd100.6.azurestaticapps.net"
    echo ""
    echo -e "${CYAN}  Login credentials:${NC}"
    echo -e "  Email: admin@test.com"
    echo -e "  Password: admin123"
else
    echo -e "${RED}  ✗ Setup incomplete - could not authenticate${NC}"
    echo ""
    echo -e "${YELLOW}  Check Azure API logs for errors${NC}"
fi

echo ""
echo -e "${BLUE}  API: $API_URL${NC}"
echo -e "${BLUE}  Completed at: $(date)${NC}"
echo ""
