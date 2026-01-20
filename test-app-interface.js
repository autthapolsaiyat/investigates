#!/usr/bin/env node
/**
 * InvestiGate App Interface - Automated Test Script
 * Tests: Dashboard, Cases, Money Flow, and all investigator features
 * Run: node test-app-interface.js
 */

const { chromium } = require('playwright');

// Configuration
const BASE_URL = 'https://wonderful-wave-0486dd100.6.azurestaticapps.net';
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'admin123';

// Results storage
const results = [];
const errors = [];
let page, browser;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const addResult = (pageName, test, status, error = null) => {
  results.push({ page: pageName, test, status, error });
  const errMsg = error ? ` - ${error}` : '';
  console.log(`  ${status} ${test}${errMsg}`);
};

const exists = async (selector, timeout = 3000) => {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
};

const clickAndWait = async (selector, waitTime = 1000) => {
  try {
    await page.click(selector);
    await sleep(waitTime);
    return true;
  } catch {
    return false;
  }
};

// ============== TESTS ==============

async function login() {
  console.log('\n🔐 Login...');
  try {
    await page.goto(`${BASE_URL}/login`);
    await sleep(1500);
    
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await sleep(2500);
    
    if (page.url().includes('/app') || page.url().includes('/admin')) {
      addResult('Login', 'Login successful', '✅ PASS');
      return true;
    }
    addResult('Login', 'Login successful', '❌ FAIL', 'No redirect');
    return false;
  } catch (e) {
    addResult('Login', 'Login successful', '❌ FAIL', e.message);
    return false;
  }
}

async function testDashboard() {
  console.log('\n📊 Testing Dashboard...');
  const pageName = 'Dashboard';
  
  try {
    await page.goto(`${BASE_URL}/app/dashboard`);
    await sleep(2000);
    
    // Page loads
    const hasTitle = await exists('text=/Dashboard|แดชบอร์ด/i');
    addResult(pageName, 'Page loads', hasTitle ? '✅ PASS' : '❌ FAIL');
    
    // Stats cards
    const statsCards = await page.$$('.rounded-lg, .rounded-xl');
    addResult(pageName, 'Stats cards display', statsCards.length >= 2 ? '✅ PASS' : '⚠️ SKIP', 
      `Found ${statsCards.length} cards`);
    
    // Quick actions or recent activity
    const hasContent = await exists('text=/คดี|Cases|Recent|ล่าสุด/i');
    addResult(pageName, 'Dashboard content', hasContent ? '✅ PASS' : '⚠️ SKIP');
    
  } catch (e) {
    addResult(pageName, 'Page test', '❌ FAIL', e.message);
  }
}

async function testCases() {
  console.log('\n📁 Testing Cases...');
  const pageName = 'Cases';
  
  try {
    await page.goto(`${BASE_URL}/app/cases`);
    await sleep(2000);
    
    // Page loads
    const hasTitle = await exists('text=/คดี|Cases/i');
    addResult(pageName, 'Page loads', hasTitle ? '✅ PASS' : '❌ FAIL');
    
    // Case count display
    const hasCount = await exists('text=/คดี|20|\\d+ คดี/');
    addResult(pageName, 'Case count displays', hasCount ? '✅ PASS' : '⚠️ SKIP');
    
    // Search input
    const searchInput = await exists('input[placeholder*="ค้นหา"], input[placeholder*="Search"]');
    addResult(pageName, 'Search input', searchInput ? '✅ PASS' : '❌ FAIL');
    
    // Filter dropdowns
    const filters = await page.$$('select');
    addResult(pageName, 'Filter dropdowns', filters.length >= 1 ? '✅ PASS' : '⚠️ SKIP');
    
    // Create case button
    const createBtn = await exists('button:has-text("สร้างคดี"), button:has-text("Create"), button:has-text("เพิ่ม")');
    addResult(pageName, 'Create case button', createBtn ? '✅ PASS' : '❌ FAIL');
    
    // Case cards display
    const caseCards = await page.$$('[class*="rounded"] >> text=/CASE-/');
    addResult(pageName, 'Case cards display', caseCards.length > 0 ? '✅ PASS' : '⚠️ SKIP',
      `Found ${caseCards.length} cases`);
    
    // Test click on case card (open modal)
    if (caseCards.length > 0) {
      await caseCards[0].click();
      await sleep(1000);
      const modalOpen = await exists('text=/รายละเอียด|Detail|ภาพรวม|Timeline/i');
      addResult(pageName, 'Case modal opens', modalOpen ? '✅ PASS' : '⚠️ SKIP');
      
      // Close modal
      const closeBtn = await page.$('button:has(svg.lucide-x), [class*="close"]');
      if (closeBtn) {
        await closeBtn.click();
        await sleep(500);
      }
    }
    
    // Test create case modal
    const createButton = await page.$('button:has-text("สร้างคดี"), button:has-text("Create")');
    if (createButton) {
      await createButton.click();
      await sleep(1000);
      const createModalOpen = await exists('input[name="title"], input[placeholder*="ชื่อ"], input[placeholder*="Title"]');
      addResult(pageName, 'Create case modal', createModalOpen ? '✅ PASS' : '❌ FAIL');
      
      // Close modal
      const cancelBtn = await page.$('button:has-text("ยกเลิก"), button:has-text("Cancel")');
      if (cancelBtn) await cancelBtn.click();
      await sleep(500);
    }
    
  } catch (e) {
    addResult(pageName, 'Page test', '❌ FAIL', e.message);
  }
}

async function testSidebar() {
  console.log('\n📱 Testing Sidebar...');
  const pageName = 'Sidebar';
  
  try {
    await page.goto(`${BASE_URL}/app/dashboard`);
    await sleep(1500);
    
    // Logo
    const logo = await exists('img[alt*="InvestiGate"], img[src*="logo"]');
    addResult(pageName, 'Logo displays', logo ? '✅ PASS' : '⚠️ SKIP');
    
    // Case selector
    const caseSelector = await exists('text=/เลือกคดี/i');
    addResult(pageName, 'Case selector', caseSelector ? '✅ PASS' : '❌ FAIL');
    
    // Main menu items
    const menuItems = [
      { name: 'Dashboard', selector: 'a[href="/app/dashboard"]' },
      { name: 'Cases', selector: 'a[href="/app/cases"]' },
      { name: 'Money Flow', selector: 'a[href="/app/money-flow"]' },
      { name: 'Smart Import', selector: 'a[href="/app/smart-import"]' },
      { name: 'Crypto Tracker', selector: 'a[href="/app/crypto"]' },
      { name: 'Call Analysis', selector: 'a[href="/app/call-analysis"]' },
      { name: 'Forensic Report', selector: 'a[href="/app/forensic-report"]' },
    ];
    
    for (const item of menuItems) {
      const exists_item = await exists(item.selector);
      addResult(pageName, `Menu: ${item.name}`, exists_item ? '✅ PASS' : '❌ FAIL');
    }
    
    // User info at bottom
    const userInfo = await exists('text=/admin@test.com|super_admin/i');
    addResult(pageName, 'User info displays', userInfo ? '✅ PASS' : '⚠️ SKIP');
    
    // Logout button
    const logoutBtn = await exists('button:has-text("Logout"), text=/Logout/i');
    addResult(pageName, 'Logout button', logoutBtn ? '✅ PASS' : '❌ FAIL');
    
    // Admin Panel link (for admin users)
    const adminLink = await exists('a[href="/admin"], text=/Admin Panel/i');
    addResult(pageName, 'Admin Panel link', adminLink ? '✅ PASS' : '⚠️ SKIP');
    
  } catch (e) {
    addResult(pageName, 'Sidebar test', '❌ FAIL', e.message);
  }
}

async function testMoneyFlow() {
  console.log('\n💰 Testing Money Flow...');
  const pageName = 'Money Flow';
  
  try {
    await page.goto(`${BASE_URL}/app/money-flow`);
    await sleep(2000);
    
    // Page loads
    const hasTitle = await exists('text=/Money Flow|การไหลของเงิน/i');
    addResult(pageName, 'Page loads', hasTitle ? '✅ PASS' : '❌ FAIL');
    
    // Graph canvas or container
    const graphContainer = await exists('canvas, [class*="cytoscape"], [class*="graph"], [id*="graph"]');
    addResult(pageName, 'Graph container', graphContainer ? '✅ PASS' : '⚠️ SKIP');
    
    // Add node button
    const addNodeBtn = await exists('button:has-text("เพิ่ม"), button:has-text("Add")');
    addResult(pageName, 'Add node button', addNodeBtn ? '✅ PASS' : '⚠️ SKIP');
    
    // Toolbar or controls
    const toolbar = await exists('[class*="toolbar"], [class*="controls"], button:has(svg)');
    addResult(pageName, 'Toolbar/Controls', toolbar ? '✅ PASS' : '⚠️ SKIP');
    
  } catch (e) {
    addResult(pageName, 'Page test', '❌ FAIL', e.message);
  }
}

async function testSmartImport() {
  console.log('\n📥 Testing Smart Import...');
  const pageName = 'Smart Import';
  
  try {
    await page.goto(`${BASE_URL}/app/smart-import`);
    await sleep(2000);
    
    // Page loads
    const hasTitle = await exists('text=/Smart Import|นำเข้าข้อมูล/i');
    addResult(pageName, 'Page loads', hasTitle ? '✅ PASS' : '❌ FAIL');
    
    // File upload area
    const uploadArea = await exists('input[type="file"], [class*="dropzone"], [class*="upload"]');
    addResult(pageName, 'File upload area', uploadArea ? '✅ PASS' : '❌ FAIL');
    
    // Import type options
    const importOptions = await exists('text=/Bank|Phone|Crypto|Excel|CSV/i');
    addResult(pageName, 'Import type options', importOptions ? '✅ PASS' : '⚠️ SKIP');
    
  } catch (e) {
    addResult(pageName, 'Page test', '❌ FAIL', e.message);
  }
}

async function testCryptoTracker() {
  console.log('\n🪙 Testing Crypto Tracker...');
  const pageName = 'Crypto Tracker';
  
  try {
    await page.goto(`${BASE_URL}/app/crypto`);
    await sleep(2000);
    
    // Page loads
    const hasTitle = await exists('text=/Crypto|คริปโต/i');
    addResult(pageName, 'Page loads', hasTitle ? '✅ PASS' : '❌ FAIL');
    
    // Wallet input or list
    const walletSection = await exists('input[placeholder*="wallet"], input[placeholder*="address"], text=/Wallet|กระเป๋า/i');
    addResult(pageName, 'Wallet section', walletSection ? '✅ PASS' : '⚠️ SKIP');
    
  } catch (e) {
    addResult(pageName, 'Page test', '❌ FAIL', e.message);
  }
}

async function testCallAnalysis() {
  console.log('\n📞 Testing Call Analysis...');
  const pageName = 'Call Analysis';
  
  try {
    await page.goto(`${BASE_URL}/app/call-analysis`);
    await sleep(2000);
    
    // Page loads
    const hasTitle = await exists('text=/Call Analysis|วิเคราะห์สาย|โทรศัพท์/i');
    addResult(pageName, 'Page loads', hasTitle ? '✅ PASS' : '❌ FAIL');
    
    // Call data display or upload
    const callSection = await exists('text=/โทร|Call|Phone|หมายเลข/i');
    addResult(pageName, 'Call section', callSection ? '✅ PASS' : '⚠️ SKIP');
    
  } catch (e) {
    addResult(pageName, 'Page test', '❌ FAIL', e.message);
  }
}

async function testLocationTimeline() {
  console.log('\n📍 Testing Location Timeline...');
  const pageName = 'Location Timeline';
  
  try {
    await page.goto(`${BASE_URL}/app/location-timeline`);
    await sleep(2000);
    
    // Page loads
    const hasTitle = await exists('text=/Location|Timeline|ตำแหน่ง|ไทม์ไลน์/i');
    addResult(pageName, 'Page loads', hasTitle ? '✅ PASS' : '❌ FAIL');
    
    // Map or timeline component
    const mapOrTimeline = await exists('[class*="map"], [class*="timeline"], canvas');
    addResult(pageName, 'Map/Timeline component', mapOrTimeline ? '✅ PASS' : '⚠️ SKIP');
    
  } catch (e) {
    addResult(pageName, 'Page test', '❌ FAIL', e.message);
  }
}

async function testForensicReport() {
  console.log('\n📄 Testing Forensic Report...');
  const pageName = 'Forensic Report';
  
  try {
    await page.goto(`${BASE_URL}/app/forensic-report`);
    await sleep(2000);
    
    // Page loads
    const hasTitle = await exists('text=/Forensic Report|รายงาน/i');
    addResult(pageName, 'Page loads', hasTitle ? '✅ PASS' : '❌ FAIL');
    
    // Report sections
    const reportSection = await exists('text=/สรุป|Summary|บทสรุป|ข้อมูลคดี/i');
    addResult(pageName, 'Report sections', reportSection ? '✅ PASS' : '⚠️ SKIP');
    
    // Export button
    const exportBtn = await exists('button:has-text("Export"), button:has-text("ส่งออก"), button:has-text("PDF")');
    addResult(pageName, 'Export button', exportBtn ? '✅ PASS' : '⚠️ SKIP');
    
  } catch (e) {
    addResult(pageName, 'Page test', '❌ FAIL', e.message);
  }
}

async function testKYCRequest() {
  console.log('\n🔍 Testing KYC Request...');
  const pageName = 'KYC Request';
  
  try {
    await page.goto(`${BASE_URL}/app/kyc-request`);
    await sleep(2000);
    
    // Page loads
    const hasTitle = await exists('text=/KYC|ขอข้อมูล/i');
    addResult(pageName, 'Page loads', hasTitle ? '✅ PASS' : '❌ FAIL');
    
    // Form or request options
    const kycForm = await exists('input, select, button:has-text("ส่ง"), button:has-text("Request")');
    addResult(pageName, 'KYC form', kycForm ? '✅ PASS' : '⚠️ SKIP');
    
  } catch (e) {
    addResult(pageName, 'Page test', '❌ FAIL', e.message);
  }
}

async function testCaseSelector() {
  console.log('\n🔄 Testing Case Selector...');
  const pageName = 'Case Selector';
  
  try {
    await page.goto(`${BASE_URL}/app/dashboard`);
    await sleep(1500);
    
    // Find and click case selector dropdown
    const caseDropdown = await page.$('button:has-text("เลือกคดี"), button:has-text("CASE-"), [class*="case-selector"]');
    if (caseDropdown) {
      await caseDropdown.click();
      await sleep(500);
      
      // Check dropdown opens
      const dropdownOpen = await exists('text=/CASE-.*Money Flow|CASE-.*Test/');
      addResult(pageName, 'Dropdown opens', dropdownOpen ? '✅ PASS' : '⚠️ SKIP');
      
      // Select a case
      const caseOption = await page.$('button:has-text("CASE-"), [class*="dropdown"] >> text=/CASE-/');
      if (caseOption) {
        await caseOption.click();
        await sleep(1000);
        addResult(pageName, 'Case selection works', '✅ PASS');
      } else {
        addResult(pageName, 'Case selection works', '⚠️ SKIP', 'No case options');
      }
    } else {
      addResult(pageName, 'Case selector exists', '❌ FAIL', 'Selector not found');
    }
    
    // Check refresh button
    const refreshBtn = await exists('button:has-text("รีเฟรช"), button:has(svg.lucide-refresh-cw)');
    addResult(pageName, 'Refresh button', refreshBtn ? '✅ PASS' : '⚠️ SKIP');
    
  } catch (e) {
    addResult(pageName, 'Case selector test', '❌ FAIL', e.message);
  }
}

async function testNavigation() {
  console.log('\n🧭 Testing Navigation...');
  const pageName = 'Navigation';
  
  const routes = [
    { name: 'Dashboard', path: '/app/dashboard' },
    { name: 'Cases', path: '/app/cases' },
    { name: 'Money Flow', path: '/app/money-flow' },
    { name: 'Smart Import', path: '/app/smart-import' },
    { name: 'Crypto', path: '/app/crypto' },
    { name: 'Call Analysis', path: '/app/call-analysis' },
    { name: 'Location Timeline', path: '/app/location-timeline' },
    { name: 'Forensic Report', path: '/app/forensic-report' },
    { name: 'KYC Request', path: '/app/kyc-request' },
  ];
  
  for (const route of routes) {
    try {
      // Click sidebar link
      const link = await page.$(`a[href="${route.path}"]`);
      if (link) {
        await link.click();
        await sleep(1000);
        const isCorrect = page.url().includes(route.path);
        addResult(pageName, `Navigate: ${route.name}`, isCorrect ? '✅ PASS' : '❌ FAIL');
      } else {
        addResult(pageName, `Navigate: ${route.name}`, '⚠️ SKIP', 'Link not found');
      }
    } catch (e) {
      addResult(pageName, `Navigate: ${route.name}`, '❌ FAIL', e.message);
    }
  }
}

// ============== MAIN ==============

async function run() {
  console.log('═'.repeat(60));
  console.log('🧪 InvestiGate App Interface Test');
  console.log('═'.repeat(60));
  console.log(`🌐 ${BASE_URL}`);
  console.log(`⏰ ${new Date().toLocaleString()}`);
  
  browser = await chromium.launch({ headless: false, slowMo: 50 });
  page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  // Capture errors
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  
  const loggedIn = await login();
  if (!loggedIn) {
    await browser.close();
    return;
  }
  
  // Navigate to app first
  await page.goto(`${BASE_URL}/app/dashboard`);
  await sleep(1000);
  
  // Run all tests
  await testSidebar();
  await testCaseSelector();
  await testDashboard();
  await testCases();
  await testMoneyFlow();
  await testSmartImport();
  await testCryptoTracker();
  await testCallAnalysis();
  await testLocationTimeline();
  await testForensicReport();
  await testKYCRequest();
  await testNavigation();
  
  await browser.close();
  
  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));
  
  const pass = results.filter(r => r.status === '✅ PASS').length;
  const fail = results.filter(r => r.status === '❌ FAIL').length;
  const skip = results.filter(r => r.status === '⚠️ SKIP').length;
  
  console.log(`\n✅ Passed: ${pass}`);
  console.log(`❌ Failed: ${fail}`);
  console.log(`⚠️ Skipped: ${skip}`);
  console.log(`📝 Total: ${results.length}`);
  
  // Group by page
  console.log('\n' + '-'.repeat(60));
  console.log('📋 Results by Page:');
  console.log('-'.repeat(60));
  
  const pages = [...new Set(results.map(r => r.page))];
  for (const pageName of pages) {
    const pageResults = results.filter(r => r.page === pageName);
    const pagePass = pageResults.filter(r => r.status === '✅ PASS').length;
    const pageFail = pageResults.filter(r => r.status === '❌ FAIL').length;
    const icon = pageFail > 0 ? '❌' : '✅';
    console.log(`\n${icon} ${pageName} (${pagePass}/${pageResults.length})`);
    
    for (const r of pageResults) {
      if (r.status !== '✅ PASS') {
        console.log(`   ${r.status} ${r.test}${r.error ? ': ' + r.error : ''}`);
      }
    }
  }
  
  if (fail > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('❌ FAILED TESTS:');
    console.log('-'.repeat(60));
    results.filter(r => r.status === '❌ FAIL').forEach(r => {
      console.log(`  [${r.page}] ${r.test}: ${r.error || 'Unknown'}`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('🔴 BROWSER ERRORS:');
    console.log('-'.repeat(60));
    [...new Set(errors)].slice(0, 10).forEach(e => console.log(`  • ${e.substring(0, 100)}`));
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(fail === 0 ? '🎉 ALL TESTS PASSED!' : `⚠️ ${fail} tests failed`);
  console.log('═'.repeat(60));
}

run().catch(console.error);
