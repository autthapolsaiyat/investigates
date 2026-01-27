# InvestiGate Changelog

## v40.0.0 (2026-01-28) - STABLE ✅

### Features
- FBI/i2 Analyst's Notebook Style graphs (all modules)
- TTS Thai/English voice in Forensic Report
- QR Code using investigates.app domain
- Collapsible CaseInfo in Call Analysis
- Filter manual sources in Location Timeline
- Sample CSV files download
- Crypto wallet lookup via backend proxy

### Bug Fixes
- Fixed Tailwind v4 compilation (added postcss.config.js)
- Fixed SPA routing (added staticwebapp.config.json)
- Fixed crypto_transactions.py syntax error line 981

### Files Added
- postcss.config.js
- public/staticwebapp.config.json
- public/samples/*.csv

### Rollback Command
```bash
git checkout v40.0.0
```

---

## Previous Versions
- v39.x - Pre-FBI style
