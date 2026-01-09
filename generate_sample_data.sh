#!/bin/bash

# =============================================================
# InvestiGate - Forensic Sample Data Generator
# สร้างข้อมูลจำลองคดีพนันออนไลน์ขนาดใหญ่
# =============================================================

API_URL="https://investigates-api.azurewebsites.net/api/v1"
EMAIL="admin@test.com"
PASSWORD="Test1234!"

echo "================================================"
echo "🔬 InvestiGate Forensic Sample Data Generator"
echo "================================================"
echo ""

# Login
echo "🔐 Logging in..."
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi
echo "✅ Logged in successfully"
echo ""

# Create Main Case
echo "📁 Creating main investigation case..."
CASE_RESPONSE=$(curl -s -X POST "$API_URL/cases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "เครือข่ายพนันออนไลน์ข้ามชาติ - ปฏิบัติการทลายรัง",
    "description": "คดีพนันออนไลน์ขนาดใหญ่ มีเครือข่ายกระจายใน 15 จังหวัด เชื่อมโยงกับกลุ่มทุนต่างชาติ มีผู้เสียหายกว่า 500 ราย มูลค่าความเสียหายรวมกว่า 150 ล้านบาท",
    "case_type": "online_gambling",
    "priority": "critical",
    "tags": "gambling,network,cross-border,money-laundering"
  }')

CASE_ID=$(echo $CASE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
CASE_NUMBER=$(echo $CASE_RESPONSE | grep -o '"case_number":"[^"]*' | cut -d'"' -f4)

if [ -z "$CASE_ID" ]; then
  echo "❌ Failed to create case"
  echo "$CASE_RESPONSE"
  exit 1
fi

echo "✅ Created case: $CASE_NUMBER (ID: $CASE_ID)"
echo ""

# Arrays for Thai names
THAI_FIRST_NAMES=("สมชาย" "สมหญิง" "วิชัย" "วิภา" "ประสิทธิ์" "ประภา" "สุรชัย" "สุรีย์" "อนันต์" "อรุณี" "ธนกร" "ธนพร" "กิตติ" "กิตติยา" "พิชัย" "พิมพ์" "ชัยวัฒน์" "ชนิดา" "วรพงษ์" "วรรณา" "สมศักดิ์" "สมใจ" "บุญมี" "บุญศรี" "เกรียงไกร" "เกศรา" "ณัฐพล" "ณัฐธิดา" "ภูมิพัฒน์" "ภัทรา" "อภิชาติ" "อภิญญา" "ศักดิ์ชัย" "ศิริพร" "มานะ" "มาลี" "วีระ" "วีณา" "สุทธิ" "สุธิดา")
THAI_LAST_NAMES=("ใจดี" "รักษ์ดี" "มั่งมี" "ศรีสุข" "พงษ์พิพัฒน์" "วงศ์สกุล" "เจริญรุ่ง" "แสงทอง" "พรมมา" "สายทอง" "ทองดี" "เพชรดี" "สุขสวัสดิ์" "ศรีวิไล" "บุญเรือง" "จันทร์เพ็ญ" "แก้วมณี" "พลอยงาม" "รุ่งเรือง" "สว่างวงศ์")
BANKS=("KBANK" "SCB" "BBL" "KTB" "TMB" "BAY" "CIMB" "TBANK" "GSB" "BAAC")
PROVINCES=("กรุงเทพฯ" "นนทบุรี" "ปทุมธานี" "สมุทรปราการ" "ชลบุรี" "ระยอง" "เชียงใหม่" "ขอนแก่น" "นครราชสีมา" "สงขลา" "ภูเก็ต" "อุดรธานี" "พิษณุโลก" "สุราษฎร์ธานี" "นครศรีธรรมราช")

# Function to get random element from array
get_random() {
  local arr=("$@")
  echo "${arr[$RANDOM % ${#arr[@]}]}"
}

# Function to generate Thai ID
generate_thai_id() {
  echo "$((RANDOM % 9 + 1))-$((1000 + RANDOM % 9000))-$((10000 + RANDOM % 90000))-$((10 + RANDOM % 90))-$((RANDOM % 10))"
}

# Function to generate bank account
generate_bank_account() {
  echo "$((100 + RANDOM % 900))-$((RANDOM % 10))-$((10000 + RANDOM % 90000))-$((RANDOM % 10))"
}

# Function to generate phone
generate_phone() {
  local prefixes=("081" "082" "083" "084" "085" "086" "087" "088" "089" "091" "092" "093" "094" "095" "096" "097" "098" "099" "061" "062" "063" "064" "065")
  local prefix="${prefixes[$RANDOM % ${#prefixes[@]}]}"
  echo "$prefix-$((100 + RANDOM % 900))-$((1000 + RANDOM % 9000))"
}

echo "================================================"
echo "📊 Creating Nodes..."
echo "================================================"

NODE_IDS=()
SUSPECT_IDS=()
MULE_IDS=()
VICTIM_IDS=()
CRYPTO_IDS=()

# -----------------------------------------------------
# Create Boss Nodes (5 หัวหน้าเครือข่าย)
# -----------------------------------------------------
echo ""
echo "👑 Creating Boss Nodes (5)..."
for i in $(seq 1 5); do
  FNAME="${THAI_FIRST_NAMES[$RANDOM % ${#THAI_FIRST_NAMES[@]}]}"
  LNAME="${THAI_LAST_NAMES[$RANDOM % ${#THAI_LAST_NAMES[@]}]}"
  PHONE=$(generate_phone)
  ID_CARD=$(generate_thai_id)
  PROVINCE="${PROVINCES[$RANDOM % ${#PROVINCES[@]}]}"
  
  RESPONSE=$(curl -s -X POST "$API_URL/cases/$CASE_ID/money-flow/nodes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"node_type\": \"person\",
      \"label\": \"$FNAME $LNAME (หัวหน้า $i)\",
      \"identifier\": \"$ID_CARD\",
      \"phone_number\": \"$PHONE\",
      \"is_suspect\": true,
      \"is_victim\": false,
      \"x_position\": $((100 + i * 150)),
      \"y_position\": 100,
      \"risk_score\": $((90 + RANDOM % 10)),
      \"size\": 60,
      \"notes\": \"หัวหน้าเครือข่าย ระดับ $i - พื้นที่ $PROVINCE\"
    }")
  
  NODE_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  if [ ! -z "$NODE_ID" ]; then
    NODE_IDS+=($NODE_ID)
    SUSPECT_IDS+=($NODE_ID)
    echo "  ✅ Boss $i: $FNAME $LNAME (ID: $NODE_ID)"
  fi
done

# -----------------------------------------------------
# Create Operator Nodes (20 ผู้ดูแลระบบ)
# -----------------------------------------------------
echo ""
echo "💻 Creating Operator Nodes (20)..."
for i in $(seq 1 20); do
  FNAME="${THAI_FIRST_NAMES[$RANDOM % ${#THAI_FIRST_NAMES[@]}]}"
  LNAME="${THAI_LAST_NAMES[$RANDOM % ${#THAI_LAST_NAMES[@]}]}"
  PHONE=$(generate_phone)
  
  RESPONSE=$(curl -s -X POST "$API_URL/cases/$CASE_ID/money-flow/nodes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"node_type\": \"person\",
      \"label\": \"$FNAME $LNAME (OP-$i)\",
      \"identifier\": \"$(generate_thai_id)\",
      \"phone_number\": \"$PHONE\",
      \"is_suspect\": true,
      \"is_victim\": false,
      \"x_position\": $((50 + (i % 10) * 80)),
      \"y_position\": $((200 + (i / 10) * 100)),
      \"risk_score\": $((70 + RANDOM % 20)),
      \"size\": 45,
      \"notes\": \"ผู้ดูแลระบบเว็บพนัน\"
    }")
  
  NODE_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  if [ ! -z "$NODE_ID" ]; then
    NODE_IDS+=($NODE_ID)
    SUSPECT_IDS+=($NODE_ID)
  fi
  
  if [ $((i % 5)) -eq 0 ]; then
    echo "  ✅ Created $i/20 operators"
  fi
done

# -----------------------------------------------------
# Create Agent Nodes (30 เอเย่นต์)
# -----------------------------------------------------
echo ""
echo "🕵️ Creating Agent Nodes (30)..."
for i in $(seq 1 30); do
  FNAME="${THAI_FIRST_NAMES[$RANDOM % ${#THAI_FIRST_NAMES[@]}]}"
  LNAME="${THAI_LAST_NAMES[$RANDOM % ${#THAI_LAST_NAMES[@]}]}"
  PROVINCE="${PROVINCES[$RANDOM % ${#PROVINCES[@]}]}"
  
  RESPONSE=$(curl -s -X POST "$API_URL/cases/$CASE_ID/money-flow/nodes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"node_type\": \"person\",
      \"label\": \"$FNAME $LNAME (AG-$i)\",
      \"identifier\": \"$(generate_thai_id)\",
      \"phone_number\": \"$(generate_phone)\",
      \"is_suspect\": true,
      \"is_victim\": false,
      \"x_position\": $((50 + (i % 15) * 55)),
      \"y_position\": $((400 + (i / 15) * 80)),
      \"risk_score\": $((60 + RANDOM % 25)),
      \"size\": 40,
      \"notes\": \"เอเย่นต์พื้นที่ $PROVINCE\"
    }")
  
  NODE_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  if [ ! -z "$NODE_ID" ]; then
    NODE_IDS+=($NODE_ID)
    SUSPECT_IDS+=($NODE_ID)
  fi
  
  if [ $((i % 10)) -eq 0 ]; then
    echo "  ✅ Created $i/30 agents"
  fi
done

# -----------------------------------------------------
# Create Mule Bank Accounts (100 บัญชีม้า)
# -----------------------------------------------------
echo ""
echo "🐴 Creating Mule Bank Accounts (100)..."
for i in $(seq 1 100); do
  FNAME="${THAI_FIRST_NAMES[$RANDOM % ${#THAI_FIRST_NAMES[@]}]}"
  LNAME="${THAI_LAST_NAMES[$RANDOM % ${#THAI_LAST_NAMES[@]}]}"
  BANK="${BANKS[$RANDOM % ${#BANKS[@]}]}"
  ACCOUNT=$(generate_bank_account)
  
  RESPONSE=$(curl -s -X POST "$API_URL/cases/$CASE_ID/money-flow/nodes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"node_type\": \"bank_account\",
      \"label\": \"$BANK - $FNAME\",
      \"identifier\": \"$ACCOUNT\",
      \"bank_name\": \"$BANK\",
      \"account_name\": \"$FNAME $LNAME\",
      \"is_suspect\": false,
      \"is_victim\": false,
      \"x_position\": $((50 + (i % 20) * 42)),
      \"y_position\": $((600 + (i / 20) * 60)),
      \"risk_score\": $((50 + RANDOM % 40)),
      \"size\": 35,
      \"notes\": \"บัญชีม้า - ใช้รับ/โอนเงิน\"
    }")
  
  NODE_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  if [ ! -z "$NODE_ID" ]; then
    NODE_IDS+=($NODE_ID)
    MULE_IDS+=($NODE_ID)
  fi
  
  if [ $((i % 25)) -eq 0 ]; then
    echo "  ✅ Created $i/100 mule accounts"
  fi
done

# -----------------------------------------------------
# Create Victim Nodes (200 เหยื่อ)
# -----------------------------------------------------
echo ""
echo "😢 Creating Victim Nodes (200)..."
for i in $(seq 1 200); do
  FNAME="${THAI_FIRST_NAMES[$RANDOM % ${#THAI_FIRST_NAMES[@]}]}"
  LNAME="${THAI_LAST_NAMES[$RANDOM % ${#THAI_LAST_NAMES[@]}]}"
  PROVINCE="${PROVINCES[$RANDOM % ${#PROVINCES[@]}]}"
  
  RESPONSE=$(curl -s -X POST "$API_URL/cases/$CASE_ID/money-flow/nodes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"node_type\": \"person\",
      \"label\": \"$FNAME $LNAME\",
      \"identifier\": \"$(generate_thai_id)\",
      \"phone_number\": \"$(generate_phone)\",
      \"is_suspect\": false,
      \"is_victim\": true,
      \"x_position\": $((50 + (i % 25) * 35)),
      \"y_position\": $((900 + (i / 25) * 50)),
      \"risk_score\": 0,
      \"size\": 30,
      \"notes\": \"ผู้เสียหาย - พื้นที่ $PROVINCE\"
    }")
  
  NODE_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  if [ ! -z "$NODE_ID" ]; then
    NODE_IDS+=($NODE_ID)
    VICTIM_IDS+=($NODE_ID)
  fi
  
  if [ $((i % 50)) -eq 0 ]; then
    echo "  ✅ Created $i/200 victims"
  fi
done

# -----------------------------------------------------
# Create Crypto Wallets (50 กระเป๋าคริปโต)
# -----------------------------------------------------
echo ""
echo "₿ Creating Crypto Wallets (50)..."
BLOCKCHAINS=("Bitcoin" "Ethereum" "USDT-TRC20" "USDT-ERC20" "BNB")
for i in $(seq 1 50); do
  BLOCKCHAIN="${BLOCKCHAINS[$RANDOM % ${#BLOCKCHAINS[@]}]}"
  
  # Generate wallet address based on blockchain
  if [[ "$BLOCKCHAIN" == "Bitcoin" ]]; then
    WALLET="bc1q$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 38 | head -n 1)"
  elif [[ "$BLOCKCHAIN" == *"Ethereum"* ]] || [[ "$BLOCKCHAIN" == *"ERC20"* ]]; then
    WALLET="0x$(cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 40 | head -n 1)"
  else
    WALLET="T$(cat /dev/urandom | tr -dc 'A-Za-z0-9' | fold -w 33 | head -n 1)"
  fi
  
  RESPONSE=$(curl -s -X POST "$API_URL/cases/$CASE_ID/money-flow/nodes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"node_type\": \"crypto_wallet\",
      \"label\": \"$BLOCKCHAIN Wallet $i\",
      \"identifier\": \"${WALLET:0:20}...\",
      \"blockchain\": \"$BLOCKCHAIN\",
      \"wallet_address\": \"$WALLET\",
      \"is_suspect\": true,
      \"is_victim\": false,
      \"x_position\": $((50 + (i % 10) * 85)),
      \"y_position\": $((1400 + (i / 10) * 70)),
      \"risk_score\": $((80 + RANDOM % 20)),
      \"size\": 40,
      \"notes\": \"กระเป๋าคริปโตสำหรับฟอกเงิน\"
    }")
  
  NODE_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  if [ ! -z "$NODE_ID" ]; then
    NODE_IDS+=($NODE_ID)
    CRYPTO_IDS+=($NODE_ID)
  fi
  
  if [ $((i % 10)) -eq 0 ]; then
    echo "  ✅ Created $i/50 crypto wallets"
  fi
done

# -----------------------------------------------------
# Create Exchange Nodes (10 แหล่งแลกเปลี่ยน)
# -----------------------------------------------------
echo ""
echo "🏦 Creating Exchange Nodes (10)..."
EXCHANGES=("Bitkub" "Binance" "Satang Pro" "Zipmex" "Gulf Binance" "FTX" "Huobi" "OKX" "Gate.io" "KuCoin")
for i in $(seq 0 9); do
  EXCHANGE="${EXCHANGES[$i]}"
  
  RESPONSE=$(curl -s -X POST "$API_URL/cases/$CASE_ID/money-flow/nodes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"node_type\": \"exchange\",
      \"label\": \"$EXCHANGE\",
      \"identifier\": \"Exchange-$((i+1))\",
      \"is_suspect\": false,
      \"is_victim\": false,
      \"x_position\": $((100 + i * 80)),
      \"y_position\": 1600,
      \"risk_score\": 30,
      \"size\": 50,
      \"notes\": \"ศูนย์ซื้อขายคริปโต\"
    }")
  
  NODE_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  if [ ! -z "$NODE_ID" ]; then
    NODE_IDS+=($NODE_ID)
  fi
done
echo "  ✅ Created 10 exchanges"

echo ""
echo "================================================"
echo "📊 Node Summary:"
echo "   - Boss nodes: 5"
echo "   - Operators: 20"
echo "   - Agents: 30"
echo "   - Mule accounts: 100"
echo "   - Victims: 200"
echo "   - Crypto wallets: 50"
echo "   - Exchanges: 10"
echo "   - TOTAL NODES: ${#NODE_IDS[@]}"
echo "================================================"

# -----------------------------------------------------
# Create Edges (Transactions)
# -----------------------------------------------------
echo ""
echo "================================================"
echo "🔗 Creating Edges (Transactions)..."
echo "================================================"

EDGE_COUNT=0

# Victims -> Mules (ฝากเงินเข้าเล่นพนัน)
echo ""
echo "💸 Creating Victim -> Mule transactions..."
for i in $(seq 0 $((${#VICTIM_IDS[@]} - 1))); do
  VICTIM_ID=${VICTIM_IDS[$i]}
  MULE_ID=${MULE_IDS[$((RANDOM % ${#MULE_IDS[@]}))]}
  AMOUNT=$((5000 + RANDOM % 95000))
  DAY=$((1 + RANDOM % 28))
  HOUR=$((8 + RANDOM % 14))
  
  curl -s -X POST "$API_URL/cases/$CASE_ID/money-flow/edges" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"from_node_id\": $VICTIM_ID,
      \"to_node_id\": $MULE_ID,
      \"amount\": $AMOUNT,
      \"currency\": \"THB\",
      \"transaction_date\": \"2026-01-$(printf '%02d' $DAY)T$(printf '%02d' $HOUR):$((RANDOM % 60)):00Z\",
      \"transaction_ref\": \"VIC-MUL-$((i+1))\",
      \"label\": \"ฝากเงินเล่นพนัน\",
      \"edge_type\": \"deposit\",
      \"width\": 2
    }" > /dev/null
  
  EDGE_COUNT=$((EDGE_COUNT + 1))
  
  if [ $((i % 50)) -eq 0 ] && [ $i -gt 0 ]; then
    echo "  ✅ Created $i/200 victim->mule edges"
  fi
done
echo "  ✅ Completed 200 victim->mule transactions"

# Mules -> Agents (รวมเงินส่งเอเย่นต์)
echo ""
echo "💸 Creating Mule -> Agent transactions..."
for i in $(seq 0 99); do
  MULE_ID=${MULE_IDS[$i]}
  AGENT_ID=${SUSPECT_IDS[$((25 + RANDOM % 30))]}  # Agents start at index 25
  AMOUNT=$((50000 + RANDOM % 450000))
  
  curl -s -X POST "$API_URL/cases/$CASE_ID/money-flow/edges" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"from_node_id\": $MULE_ID,
      \"to_node_id\": $AGENT_ID,
      \"amount\": $AMOUNT,
      \"currency\": \"THB\",
      \"transaction_date\": \"2026-01-$(printf '%02d' $((1 + RANDOM % 28)))T$((10 + RANDOM % 12)):$((RANDOM % 60)):00Z\",
      \"transaction_ref\": \"MUL-AGT-$((i+1))\",
      \"label\": \"รวมเงินส่งเอเย่นต์\",
      \"edge_type\": \"transfer\",
      \"width\": 3
    }" > /dev/null
  
  EDGE_COUNT=$((EDGE_COUNT + 1))
  
  if [ $((i % 25)) -eq 0 ] && [ $i -gt 0 ]; then
    echo "  ✅ Created $i/100 mule->agent edges"
  fi
done
echo "  ✅ Completed 100 mule->agent transactions"

# Agents -> Operators (ส่งต่อให้ OP)
echo ""
echo "💸 Creating Agent -> Operator transactions..."
for i in $(seq 1 60); do
  AGENT_ID=${SUSPECT_IDS[$((25 + RANDOM % 30))]}
  OP_ID=${SUSPECT_IDS[$((5 + RANDOM % 20))]}  # Operators at index 5-24
  AMOUNT=$((200000 + RANDOM % 800000))
  
  curl -s -X POST "$API_URL/cases/$CASE_ID/money-flow/edges" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"from_node_id\": $AGENT_ID,
      \"to_node_id\": $OP_ID,
      \"amount\": $AMOUNT,
      \"currency\": \"THB\",
      \"transaction_date\": \"2026-01-$(printf '%02d' $((1 + RANDOM % 28)))T$((12 + RANDOM % 10)):$((RANDOM % 60)):00Z\",
      \"transaction_ref\": \"AGT-OP-$i\",
      \"label\": \"ส่งต่อให้ผู้ดูแล\",
      \"edge_type\": \"transfer\",
      \"width\": 4
    }" > /dev/null
  
  EDGE_COUNT=$((EDGE_COUNT + 1))
done
echo "  ✅ Completed 60 agent->operator transactions"

# Operators -> Boss (รายงานหัวหน้า)
echo ""
echo "💸 Creating Operator -> Boss transactions..."
for i in $(seq 1 40); do
  OP_ID=${SUSPECT_IDS[$((5 + RANDOM % 20))]}
  BOSS_ID=${SUSPECT_IDS[$((RANDOM % 5))]}  # Boss at index 0-4
  AMOUNT=$((500000 + RANDOM % 2000000))
  
  curl -s -X POST "$API_URL/cases/$CASE_ID/money-flow/edges" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"from_node_id\": $OP_ID,
      \"to_node_id\": $BOSS_ID,
      \"amount\": $AMOUNT,
      \"currency\": \"THB\",
      \"transaction_date\": \"2026-01-$(printf '%02d' $((1 + RANDOM % 28)))T$((14 + RANDOM % 8)):$((RANDOM % 60)):00Z\",
      \"transaction_ref\": \"OP-BOSS-$i\",
      \"label\": \"รายงานหัวหน้า\",
      \"edge_type\": \"transfer\",
      \"width\": 5
    }" > /dev/null
  
  EDGE_COUNT=$((EDGE_COUNT + 1))
done
echo "  ✅ Completed 40 operator->boss transactions"

# Boss -> Crypto (ฟอกเงินคริปโต)
echo ""
echo "₿ Creating Boss -> Crypto transactions..."
for i in $(seq 1 30); do
  BOSS_ID=${SUSPECT_IDS[$((RANDOM % 5))]}
  CRYPTO_ID=${CRYPTO_IDS[$((RANDOM % ${#CRYPTO_IDS[@]}))]}
  AMOUNT=$((1000000 + RANDOM % 5000000))
  
  curl -s -X POST "$API_URL/cases/$CASE_ID/money-flow/edges" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"from_node_id\": $BOSS_ID,
      \"to_node_id\": $CRYPTO_ID,
      \"amount\": $AMOUNT,
      \"currency\": \"THB\",
      \"transaction_date\": \"2026-01-$(printf '%02d' $((1 + RANDOM % 28)))T$((18 + RANDOM % 5)):$((RANDOM % 60)):00Z\",
      \"transaction_ref\": \"BOSS-CRYPTO-$i\",
      \"label\": \"ซื้อคริปโต\",
      \"edge_type\": \"crypto_purchase\",
      \"width\": 4
    }" > /dev/null
  
  EDGE_COUNT=$((EDGE_COUNT + 1))
done
echo "  ✅ Completed 30 boss->crypto transactions"

# Crypto -> Crypto (โอนระหว่าง wallet)
echo ""
echo "₿ Creating Crypto -> Crypto transactions..."
for i in $(seq 1 50); do
  FROM_ID=${CRYPTO_IDS[$((RANDOM % ${#CRYPTO_IDS[@]}))]}
  TO_ID=${CRYPTO_IDS[$((RANDOM % ${#CRYPTO_IDS[@]}))]}
  
  if [ "$FROM_ID" != "$TO_ID" ]; then
    curl -s -X POST "$API_URL/cases/$CASE_ID/money-flow/edges" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"from_node_id\": $FROM_ID,
        \"to_node_id\": $TO_ID,
        \"amount\": $((10000 + RANDOM % 500000)),
        \"currency\": \"USDT\",
        \"transaction_date\": \"2026-01-$(printf '%02d' $((1 + RANDOM % 28)))T$((RANDOM % 24)):$((RANDOM % 60)):00Z\",
        \"transaction_ref\": \"CRYPTO-CRYPTO-$i\",
        \"label\": \"โอนคริปโต\",
        \"edge_type\": \"crypto_transfer\",
        \"width\": 3
      }" > /dev/null
    
    EDGE_COUNT=$((EDGE_COUNT + 1))
  fi
done
echo "  ✅ Completed 50 crypto->crypto transactions"

echo ""
echo "================================================"
echo "🎉 SAMPLE DATA GENERATION COMPLETE!"
echo "================================================"
echo ""
echo "📊 Final Summary:"
echo "   Case: $CASE_NUMBER"
echo "   Case ID: $CASE_ID"
echo "   Total Nodes: ${#NODE_IDS[@]}"
echo "   Total Edges: $EDGE_COUNT"
echo ""
echo "🌐 View in browser:"
echo "   Money Flow: https://wonderful-wave-0486dd100.6.azurestaticapps.net/money-flow"
echo ""
echo "================================================"
