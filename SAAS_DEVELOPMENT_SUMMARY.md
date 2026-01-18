# InvestiGate - SaaS Development Summary
## Date: 2026-01-18

---

## ✅ สิ่งที่ทำเสร็จแล้ว (v1.0)

### Core Features
- [x] Case Management (CRUD, status, priority)
- [x] Smart Import v3 (Auto-detect, Auto-mapping, Auto-link, Risk Score)
- [x] Money Flow (Network Graph with Cytoscape.js)
- [x] Crypto Tracker (ETH, BTC, USDT, BNB, Polygon)
- [x] Call Analysis (Link Analysis)
- [x] Location Timeline (Map with Leaflet)
- [x] Forensic Report (Network Graph, Auto Summary, PDF Export)
- [x] Chain of Custody (SHA-256 Hash, QR Code verification)
- [x] Evidence System (Public verification endpoint)

### UI/UX Improvements
- [x] Case Selector in Sidebar (centralized)
- [x] Data counts badge in Sidebar
- [x] CaseInfoBar component (read-only display)
- [x] Auto-refresh badge after import
- [x] Manual refresh button
- [x] User Guide page (/guide)

### Infrastructure
- [x] Frontend: Azure Static Web Apps
- [x] Backend: Azure App Service (FastAPI)
- [x] Database: SQLite (will upgrade to PostgreSQL for SaaS)
- [x] CI/CD: GitHub Actions

---

## 🔧 Current Architecture

```
Frontend (React + TypeScript + Vite)
├── Components
│   ├── Layout (Sidebar, Header)
│   ├── UI (Button, Card, Badge, CaseSelector, CaseInfoBar)
│   └── Pages
│       ├── Dashboard
│       ├── Cases
│       ├── Smart Import
│       ├── Money Flow
│       ├── Crypto Tracker
│       ├── Call Analysis
│       ├── Location Timeline
│       ├── Forensic Report
│       ├── KYC Request
│       └── User Guide
├── Store (Zustand)
│   ├── authStore
│   └── caseStore
└── Services
    ├── api.ts
    └── blockchainApi.ts

Backend (FastAPI + Python)
├── Models
│   ├── User
│   ├── Organization
│   ├── Case
│   ├── MoneyFlowNode
│   ├── MoneyFlowEdge
│   └── Evidence
├── Routers
│   ├── auth
│   ├── users
│   ├── organizations
│   ├── cases
│   ├── money_flow
│   └── evidence
└── Database: SQLite
```

---

## 💰 SaaS Pricing Model

### License Tiers (ไม่รวม VAT 7%)
| Tier | ราคา/คน/ปี | Target |
|------|-----------|--------|
| Starter | ฿30,000 | สถานีตำรวจ |
| Professional | ฿60,000 | กองบังคับการ |
| Enterprise | ฿120,000 | กองบัญชาการ |

### Training (แยกคิด)
- ฿10,000-15,000/คน (2 วัน)
- ค่าเดินทางต่างจังหวัดเพิ่ม

### Volume Discount
- 5+ keys → -10%
- 10+ keys → -20%
- 20+ keys → ติดต่อพิเศษ

---

## 📊 Cost Analysis

### Cloud (Azure) - Per Year
| Item | Cost (THB) |
|------|-----------|
| Static Web Apps | ฿3,780 |
| App Service (B1) | ฿5,460 |
| SQL Database (S0) | ฿6,300 |
| Blob Storage | ฿2,100 |
| Domain + SSL | ฿840 |
| **Total** | **~฿18,500/year** |

### On-premise - Per Year
| Item | Cost (THB) |
|------|-----------|
| Initial Investment | ฿100,000-190,000 (one-time) |
| Electricity + Cooling | ฿9,600 |
| Internet (Static IP) | ฿30,000 |
| SSL + Maintenance | ฿17,000 |
| Backup | ฿6,000 |
| **Total** | **~฿62,600/year** |

---

## 🎯 SaaS Development Plan

### Phase 1: Core SaaS (Current Session)
- [ ] User Isolation (each user sees own data only)
- [ ] License Key System
- [ ] Landing Page
- [ ] Pricing Page
- [ ] Subscription Management
- [ ] Payment Integration (Stripe/Omise)

### Phase 2: Team Features (Future)
- [ ] Organization/Team management
- [ ] Case sharing between team members
- [ ] Role-based permissions
- [ ] Admin dashboard

### Phase 3: Enterprise (Future)
- [ ] On-premise deployment option
- [ ] API access
- [ ] Custom branding
- [ ] Priority support

---

## 🔗 URLs

- Frontend: https://wonderful-wave-0486dd100.6.azurestaticapps.net
- Backend: https://investigates-api.azurewebsites.net
- API Docs: https://investigates-api.azurewebsites.net/docs
- User Guide: https://wonderful-wave-0486dd100.6.azurestaticapps.net/guide
- Verify: https://wonderful-wave-0486dd100.6.azurestaticapps.net/verify

---

## 📁 Key Files

### Frontend
- `src/store/caseStore.ts` - Global case state
- `src/components/layout/Sidebar.tsx` - Main navigation with case selector
- `src/components/ui/CaseInfoBar.tsx` - Read-only case display
- `src/pages/import/SmartImport.tsx` - Data import with SHA-256

### Backend
- `app/models/` - Database models
- `app/routers/` - API endpoints
- `app/main.py` - FastAPI app entry

---

## 🔐 Current Auth

- JWT-based authentication
- Roles: super_admin, admin, user
- Test account: admin@test.com / admin123

---

## 📝 Notes for Next Session

1. Need to add `subscription` model to backend
2. Need to add `license_key` field to User model
3. Need to filter data by user_id (isolation)
4. Landing page should be public (no auth required)
5. Consider using Omise for Thai payment (supports PromptPay)
