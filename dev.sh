#!/bin/bash

# ===========================================
# InvestiGate - Full Local Development Setup
# ===========================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║     🔍 InvestiGate - Local Development Setup               ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}Error: Please run this script from the investigates root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Select what to start:${NC}"
echo "  1) Backend only (API on port 8000)"
echo "  2) Frontend only (UI on port 5173)"
echo "  3) Both Backend + Frontend"
echo "  4) Run API Tests"
echo "  5) Create Demo Data"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo -e "\n${GREEN}Starting Backend...${NC}"
        cd backend
        
        # Setup venv
        if [ ! -d "venv" ]; then
            echo -e "${YELLOW}Creating virtual environment...${NC}"
            python3 -m venv venv
        fi
        source venv/bin/activate
        
        # Install deps
        echo -e "${YELLOW}Installing dependencies...${NC}"
        pip install -r requirements.txt -q
        
        # Create .env if not exists
        if [ ! -f ".env" ]; then
            cat > .env << 'EOF'
DATABASE_URL=sqlite:///./investigates.db
JWT_SECRET_KEY=local-dev-secret-key
DEBUG=True
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
EOF
        fi
        
        echo -e "\n${GREEN}Backend running at: http://localhost:8000${NC}"
        echo -e "${BLUE}Swagger UI: http://localhost:8000/docs${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"
        
        uvicorn app.main:app --reload --port 8000
        ;;
        
    2)
        echo -e "\n${GREEN}Starting Frontend...${NC}"
        cd frontend
        
        # Install deps if needed
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}Installing dependencies...${NC}"
            npm install
        fi
        
        echo -e "\n${GREEN}Frontend running at: http://localhost:5173${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"
        
        npm run dev
        ;;
        
    3)
        echo -e "\n${GREEN}Starting Both Backend & Frontend...${NC}"
        
        # Start backend in background
        echo -e "${YELLOW}Starting Backend...${NC}"
        cd backend
        if [ ! -d "venv" ]; then
            python3 -m venv venv
        fi
        source venv/bin/activate
        pip install -r requirements.txt -q
        
        if [ ! -f ".env" ]; then
            cat > .env << 'EOF'
DATABASE_URL=sqlite:///./investigates.db
JWT_SECRET_KEY=local-dev-secret-key
DEBUG=True
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
EOF
        fi
        
        uvicorn app.main:app --reload --port 8000 &
        BACKEND_PID=$!
        cd ..
        
        # Wait for backend to start
        sleep 3
        
        # Start frontend
        echo -e "${YELLOW}Starting Frontend...${NC}"
        cd frontend
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        
        echo -e "\n${GREEN}════════════════════════════════════════${NC}"
        echo -e "${GREEN}  Backend:  http://localhost:8000${NC}"
        echo -e "${GREEN}  Swagger:  http://localhost:8000/docs${NC}"
        echo -e "${GREEN}  Frontend: http://localhost:5173${NC}"
        echo -e "${GREEN}════════════════════════════════════════${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop both${NC}\n"
        
        # Trap Ctrl+C to kill backend too
        trap "kill $BACKEND_PID 2>/dev/null; exit" INT
        
        npm run dev
        ;;
        
    4)
        echo -e "\n${GREEN}Running API Tests...${NC}"
        
        # Check if backend is running
        if ! curl -s http://localhost:8000/docs > /dev/null 2>&1; then
            echo -e "${RED}Error: Backend is not running!${NC}"
            echo -e "${YELLOW}Please start backend first (option 1 or 3)${NC}"
            exit 1
        fi
        
        # Run test script
        if [ -f "test-api.sh" ]; then
            chmod +x test-api.sh
            ./test-api.sh
        else
            echo -e "${RED}Error: test-api.sh not found${NC}"
        fi
        ;;
        
    5)
        echo -e "\n${GREEN}Creating Demo Data...${NC}"
        
        # Check if backend is running
        if ! curl -s http://localhost:8000/docs > /dev/null 2>&1; then
            echo -e "${RED}Error: Backend is not running!${NC}"
            echo -e "${YELLOW}Please start backend first (option 1 or 3)${NC}"
            exit 1
        fi
        
        API_URL="http://localhost:8000/api/v1"
        
        # Create demo organization
        echo -e "${YELLOW}Creating organization...${NC}"
        curl -s -X POST "$API_URL/organizations" \
            -H "Content-Type: application/json" \
            -d '{"name":"กองบังคับการปราบปรามการกระทำความผิดเกี่ยวกับอาชญากรรมทางเศรษฐกิจ","code":"ECD","description":"Economic Crime Division"}' | jq .
        
        # Create demo cases
        echo -e "${YELLOW}Creating cases...${NC}"
        
        # Case 1
        CASE1=$(curl -s -X POST "$API_URL/cases" \
            -H "Content-Type: application/json" \
            -d '{
                "title":"คดีหลอกลงทุน Bitcoin",
                "description":"ผู้เสียหายถูกชักชวนลงทุน Bitcoin ผ่าน Line Group",
                "case_type":"cryptocurrency",
                "status":"investigating",
                "priority":"high",
                "total_amount":15000000,
                "tags":"bitcoin,line,fraud"
            }')
        CASE1_ID=$(echo $CASE1 | jq -r '.id')
        echo -e "  ${GREEN}Created Case 1: ID $CASE1_ID${NC}"
        
        # Add nodes to Case 1
        if [ "$CASE1_ID" != "null" ]; then
            curl -s -X POST "$API_URL/cases/$CASE1_ID/money-flow/nodes" \
                -H "Content-Type: application/json" \
                -d '{"label":"ผู้ต้องหา นาย ก","node_type":"person","risk_score":95}' > /dev/null
            curl -s -X POST "$API_URL/cases/$CASE1_ID/money-flow/nodes" \
                -H "Content-Type: application/json" \
                -d '{"label":"Wallet Binance","node_type":"wallet","amount":5000000,"risk_score":85}' > /dev/null
            curl -s -X POST "$API_URL/cases/$CASE1_ID/money-flow/nodes" \
                -H "Content-Type: application/json" \
                -d '{"label":"บัญชี KBank","node_type":"bank_account","amount":10000000}' > /dev/null
            echo -e "    ${GREEN}Added 3 nodes${NC}"
        fi
        
        # Case 2
        CASE2=$(curl -s -X POST "$API_URL/cases" \
            -H "Content-Type: application/json" \
            -d '{
                "title":"คดีฟอกเงินผ่านร้านอาหาร",
                "description":"ตรวจพบการหมุนเวียนเงินผิดปกติผ่านธุรกิจร้านอาหาร",
                "case_type":"money_laundering",
                "status":"analyzing",
                "priority":"critical",
                "total_amount":50000000,
                "tags":"money-laundering,restaurant"
            }')
        CASE2_ID=$(echo $CASE2 | jq -r '.id')
        echo -e "  ${GREEN}Created Case 2: ID $CASE2_ID${NC}"
        
        # Add nodes to Case 2
        if [ "$CASE2_ID" != "null" ]; then
            curl -s -X POST "$API_URL/cases/$CASE2_ID/money-flow/nodes" \
                -H "Content-Type: application/json" \
                -d '{"label":"บริษัท ABC","node_type":"company","risk_score":95}' > /dev/null
            curl -s -X POST "$API_URL/cases/$CASE2_ID/money-flow/nodes" \
                -H "Content-Type: application/json" \
                -d '{"label":"ร้านอาหาร สาขา 1","node_type":"business","amount":15000000}' > /dev/null
            curl -s -X POST "$API_URL/cases/$CASE2_ID/money-flow/nodes" \
                -H "Content-Type: application/json" \
                -d '{"label":"ร้านอาหาร สาขา 2","node_type":"business","amount":20000000}' > /dev/null
            curl -s -X POST "$API_URL/cases/$CASE2_ID/money-flow/nodes" \
                -H "Content-Type: application/json" \
                -d '{"label":"บัญชี SCB","node_type":"bank_account","amount":35000000}' > /dev/null
            echo -e "    ${GREEN}Added 4 nodes${NC}"
        fi
        
        # Case 3
        CASE3=$(curl -s -X POST "$API_URL/cases" \
            -H "Content-Type: application/json" \
            -d '{
                "title":"คดีพนันออนไลน์ข้ามชาติ",
                "description":"เครือข่ายพนันออนไลน์รับเงินผ่าน Crypto",
                "case_type":"online_gambling",
                "status":"investigating",
                "priority":"high",
                "total_amount":100000000,
                "tags":"gambling,crypto,international"
            }')
        CASE3_ID=$(echo $CASE3 | jq -r '.id')
        echo -e "  ${GREEN}Created Case 3: ID $CASE3_ID${NC}"
        
        # Add nodes to Case 3
        if [ "$CASE3_ID" != "null" ]; then
            curl -s -X POST "$API_URL/cases/$CASE3_ID/money-flow/nodes" \
                -H "Content-Type: application/json" \
                -d '{"label":"เว็บพนัน ABC","node_type":"website","risk_score":100}' > /dev/null
            curl -s -X POST "$API_URL/cases/$CASE3_ID/money-flow/nodes" \
                -H "Content-Type: application/json" \
                -d '{"label":"Wallet USDT","node_type":"wallet","amount":50000000,"risk_score":95}' > /dev/null
            curl -s -X POST "$API_URL/cases/$CASE3_ID/money-flow/nodes" \
                -H "Content-Type: application/json" \
                -d '{"label":"Agent 1","node_type":"person","risk_score":80}' > /dev/null
            curl -s -X POST "$API_URL/cases/$CASE3_ID/money-flow/nodes" \
                -H "Content-Type: application/json" \
                -d '{"label":"Agent 2","node_type":"person","risk_score":80}' > /dev/null
            curl -s -X POST "$API_URL/cases/$CASE3_ID/money-flow/nodes" \
                -H "Content-Type: application/json" \
                -d '{"label":"บัญชี BBL","node_type":"bank_account","amount":30000000}' > /dev/null
            echo -e "    ${GREEN}Added 5 nodes${NC}"
        fi
        
        echo -e "\n${GREEN}════════════════════════════════════════${NC}"
        echo -e "${GREEN}  Demo data created successfully!${NC}"
        echo -e "${GREEN}  - 3 Cases${NC}"
        echo -e "${GREEN}  - 12 Nodes${NC}"
        echo -e "${GREEN}════════════════════════════════════════${NC}"
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
