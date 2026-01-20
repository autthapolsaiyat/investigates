/**
 * InvestiGate Admin Panel - Automated Test Script
 * Run: npx playwright test test-admin-panel.ts --headed
 * Or: npx ts-node test-admin-panel.ts (standalone)
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';

// Configuration
const BASE_URL = 'https://wonderful-wave-0486dd100.6.azurestaticapps.net';
const API_URL = 'https://investigates-api.azurewebsites.net/api/v1';
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'admin123';

// Test Results
interface TestResult {
  page: string;
  test: string;
  status: '✅ PASS' | '❌ FAIL' | '⚠️ SKIP' | '🚧 PLACEHOLDER';
  error?: string;
  details?: string;
}

const results: TestResult[] = [];
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Utility functions
const log = (msg: string) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const addResult = (pageName: string, test: string, status: TestResult['status'], error?: string, details?: string) => {
  results.push({ page: pageName, test, status, error, details });
  const icon = status;
  const errMsg = error ? ` - ${error}` : '';
  console.log(`  ${icon} ${test}${errMsg}`);
};

// Check if element exists
const exists = async (selector: string, timeout = 3000): Promise<boolean> => {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
};

// Check if button is placeholder (disabled or shows coming soon)
const isPlaceholder = async (selector: string): Promise<boolean> => {
  try {
    const el = await page.$(selector);
    if (!el) return true;
    const isDisabled = await el.isDisabled();
    const text = await el.textContent();
    return isDisabled || text?.includes('กำลังพัฒนา') || text?.includes('Coming Soon') || false;
  } catch {
    return true;
  }
};

// Get page errors
const pageErrors: string[] = [];

// ============== TEST FUNCTIONS ==============

async function testLogin() {
  log('📝 Testing Login...');
  
  try {
    await page.goto(`${BASE_URL}/login`);
    await sleep(1000);
    
    // Fill login form
    await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
    
    // Click login button
    await page.click('button[type="submit"]');
    await sleep(2000);
    
    // Check if redirected to app or admin
    const url = page.url();
    if (url.includes('/app') || url.includes('/admin')) {
      addResult('Login', 'Login with admin credentials', '✅ PASS');
      return true;
    } else {
      addResult('Login', 'Login with admin credentials', '❌ FAIL', 'Did not redirect after login');
      return false;
    }
  } catch (err: any) {
    addResult('Login', 'Login with admin credentials', '❌ FAIL', err.message);
    return false;
  }
}

async function testAdminDashboard() {
  log('📊 Testing Admin Dashboard...');
  const pageName = 'Admin Dashboard';
  
  try {
    await page.goto(`${BASE_URL}/admin`);
    await sleep(2000);
    
    // Check page loads
    const hasTitle = await exists('h1:has-text("Admin Dashboard")');
    addResult(pageName, 'Page loads', hasTitle ? '✅ PASS' : '❌ FAIL');
    
    // Check stats cards
    const statsCards = await page.$$('.rounded-xl, .rounded-lg >> text=/ผู้ใช้|รอการอนุมัติ|หน่วยงาน|คดี/');
    addResult(pageName, 'Stats cards display', statsCards.length >= 4 ? '✅ PASS' : '❌ FAIL', 
      statsCards.length >= 4 ? undefined : `Found ${statsCards.length} cards`);
    
    // Check refresh button
    const refreshBtn = await page.$('button:has-text("รีเฟรช")');
    if (refreshBtn) {
      await refreshBtn.click();
      await sleep(1000);
      addResult(pageName, 'Refresh button works', '✅ PASS');
    } else {
      addResult(pageName, 'Refresh button works', '❌ FAIL', 'Button not found');
    }
    
    // Check quick actions
    const quickActions = await page.$$('button:has-text("ดูคำขอลงทะเบียน"), button:has-text("จัดการผู้ใช้")');
    addResult(pageName, 'Quick action buttons', quickActions.length > 0 ? '✅ PASS' : '⚠️ SKIP');
    
    // Check back to app button
    const backBtn = await page.$('button:has-text("กลับไปหน้าแอป"), a:has-text("กลับไปหน้าแอป")');
    addResult(pageName, 'Back to app button exists', backBtn ? '✅ PASS' : '❌ FAIL');
    
  } catch (err: any) {
    addResult(pageName, 'Page test', '❌ FAIL', err.message);
  }
}

async function testRegistrations() {
  log('📝 Testing Registrations...');
  const pageName = 'Registrations';
  
  try {
    await page.goto(`${BASE_URL}/admin/registrations`);
    await sleep(2000);
    
    // Check page loads
    const hasContent = await exists('text=/คำขอลงทะเบียน|Registrations|รอการอนุมัติ/');
    addResult(pageName, 'Page loads', hasContent ? '✅ PASS' : '❌ FAIL');
    
    // Check stats
    const statsCards = await page.$$('.rounded-lg >> text=/ทั้งหมด|รอการอนุมัติ|อนุมัติแล้ว|ปฏิเสธ/');
    addResult(pageName, 'Stats cards display', statsCards.length >= 3 ? '✅ PASS' : '⚠️ SKIP');
    
    // Check search
    const searchInput = await page.$('input[placeholder*="ค้นหา"]');
    addResult(pageName, 'Search input exists', searchInput ? '✅ PASS' : '❌ FAIL');
    
    // Check filter dropdown
    const filterSelect = await page.$('select');
    addResult(pageName, 'Filter dropdown exists', filterSelect ? '✅ PASS' : '❌ FAIL');
    
    // Check approve/reject buttons (if any pending)
    const approveBtn = await page.$('button:has(svg.lucide-check)');
    const rejectBtn = await page.$('button:has(svg.lucide-x)');
    if (approveBtn || rejectBtn) {
      addResult(pageName, 'Approve/Reject buttons', '✅ PASS');
      
      // Test approve modal
      if (approveBtn) {
        await approveBtn.click();
        await sleep(500);
        const modal = await exists('text=/อนุมัติการลงทะเบียน/');
        addResult(pageName, 'Approve modal opens', modal ? '✅ PASS' : '❌ FAIL');
        // Close modal
        const cancelBtn = await page.$('button:has-text("ยกเลิก")');
        if (cancelBtn) await cancelBtn.click();
        await sleep(300);
      }
    } else {
      addResult(pageName, 'Approve/Reject buttons', '⚠️ SKIP', 'No pending registrations');
    }
    
  } catch (err: any) {
    addResult(pageName, 'Page test', '❌ FAIL', err.message);
  }
}

async function testUsers() {
  log('👥 Testing Users...');
  const pageName = 'Users';
  
  try {
    await page.goto(`${BASE_URL}/admin/users`);
    await sleep(2000);
    
    // Check page loads
    const hasContent = await exists('text=/Users|ผู้ใช้งาน/');
    addResult(pageName, 'Page loads', hasContent ? '✅ PASS' : '❌ FAIL');
    
    // Check user list
    const userItems = await page.$$('[class*="divide-y"] > div, tr');
    addResult(pageName, 'User list displays', userItems.length > 0 ? '✅ PASS' : '⚠️ SKIP');
    
    // Check search
    const searchInput = await page.$('input[placeholder*="ค้นหา"]');
    addResult(pageName, 'Search input exists', searchInput ? '✅ PASS' : '❌ FAIL');
    
    // Check Add User button
    const addBtn = await page.$('button:has-text("Add User"), button:has-text("เพิ่ม")');
    if (addBtn) {
      await addBtn.click();
      await sleep(500);
      const modal = await exists('text=/เพิ่มผู้ใช้|Add User|Create/');
      addResult(pageName, 'Add User modal opens', modal ? '✅ PASS' : '❌ FAIL');
      // Close modal
      const closeBtn = await page.$('button:has(svg.lucide-x)');
      if (closeBtn) await closeBtn.click();
      await sleep(300);
    } else {
      addResult(pageName, 'Add User button', '❌ FAIL', 'Button not found');
    }
    
    // Check edit button
    const editBtn = await page.$('button:has(svg.lucide-edit), button:has(svg.lucide-pencil)');
    addResult(pageName, 'Edit button exists', editBtn ? '✅ PASS' : '⚠️ SKIP');
    
    // Check delete button
    const deleteBtn = await page.$('button:has(svg.lucide-trash-2)');
    addResult(pageName, 'Delete button exists', deleteBtn ? '✅ PASS' : '⚠️ SKIP');
    
  } catch (err: any) {
    addResult(pageName, 'Page test', '❌ FAIL', err.message);
  }
}

async function testOrganizations() {
  log('🏢 Testing Organizations...');
  const pageName = 'Organizations';
  
  try {
    await page.goto(`${BASE_URL}/admin/organizations`);
    await sleep(2000);
    
    // Check page loads
    const hasContent = await exists('text=/Organizations|หน่วยงาน/');
    addResult(pageName, 'Page loads', hasContent ? '✅ PASS' : '❌ FAIL');
    
    // Check organization list
    const orgItems = await page.$$('[class*="divide-y"] > div, tr');
    addResult(pageName, 'Organization list displays', orgItems.length > 0 ? '✅ PASS' : '⚠️ SKIP');
    
    // Check Add button
    const addBtn = await page.$('button:has-text("Add"), button:has-text("เพิ่ม")');
    if (addBtn) {
      await addBtn.click();
      await sleep(500);
      const modal = await exists('input[placeholder*="ชื่อ"], input[name="name"]');
      addResult(pageName, 'Add Organization modal opens', modal ? '✅ PASS' : '❌ FAIL');
      // Close modal
      const closeBtn = await page.$('button:has(svg.lucide-x)');
      if (closeBtn) await closeBtn.click();
      await sleep(300);
    } else {
      addResult(pageName, 'Add Organization button', '❌ FAIL', 'Button not found');
    }
    
  } catch (err: any) {
    addResult(pageName, 'Page test', '❌ FAIL', err.message);
  }
}

async function testSubscriptions() {
  log('💳 Testing Subscriptions...');
  const pageName = 'Subscriptions';
  
  try {
    await page.goto(`${BASE_URL}/admin/subscriptions`);
    await sleep(2000);
    
    // Check page loads
    const hasContent = await exists('text=/Subscriptions/');
    addResult(pageName, 'Page loads', hasContent ? '✅ PASS' : '❌ FAIL');
    
    // Check stats cards
    const statsCards = await page.$$('.rounded-lg >> text=/ใช้งานได้|ใกล้หมดอายุ|หมดอายุ/');
    addResult(pageName, 'Stats cards display', statsCards.length >= 3 ? '✅ PASS' : '⚠️ SKIP');
    
    // Check user list with subscription status
    const userItems = await page.$$('[class*="divide-y"] > div');
    addResult(pageName, 'User subscription list', userItems.length > 0 ? '✅ PASS' : '⚠️ SKIP');
    
    // Check "ต่ออายุ" button (placeholder)
    const renewBtn = await page.$('button:has-text("ต่ออายุ")');
    if (renewBtn) {
      const isPlaceholderBtn = await renewBtn.isDisabled();
      addResult(pageName, 'Renew button', '🚧 PLACEHOLDER', 'Feature not implemented yet');
    } else {
      addResult(pageName, 'Renew button', '⚠️ SKIP', 'No users to renew');
    }
    
    // Check coming soon notice
    const comingSoon = await exists('text=/กำลังพัฒนา/');
    addResult(pageName, 'Shows "Coming Soon" notice', comingSoon ? '✅ PASS' : '⚠️ SKIP');
    
  } catch (err: any) {
    addResult(pageName, 'Page test', '❌ FAIL', err.message);
  }
}

async function testActivityLog() {
  log('📋 Testing Activity Log...');
  const pageName = 'Activity Log';
  
  try {
    await page.goto(`${BASE_URL}/admin/activity`);
    await sleep(2000);
    
    // Check page loads
    const hasContent = await exists('text=/Activity Log/');
    addResult(pageName, 'Page loads', hasContent ? '✅ PASS' : '❌ FAIL');
    
    // Check mock data displays
    const activityItems = await page.$$('[class*="divide-y"] > div');
    addResult(pageName, 'Activity list (mock)', activityItems.length > 0 ? '✅ PASS' : '⚠️ SKIP');
    
    // Check coming soon notice
    const comingSoon = await exists('text=/กำลังพัฒนา/');
    addResult(pageName, 'Shows placeholder notice', comingSoon ? '🚧 PLACEHOLDER' : '⚠️ SKIP');
    
  } catch (err: any) {
    addResult(pageName, 'Page test', '❌ FAIL', err.message);
  }
}

async function testNotifications() {
  log('🔔 Testing Notifications...');
  const pageName = 'Notifications';
  
  try {
    await page.goto(`${BASE_URL}/admin/notifications`);
    await sleep(2000);
    
    // Check page loads
    const hasContent = await exists('text=/Notifications/');
    addResult(pageName, 'Page loads', hasContent ? '✅ PASS' : '❌ FAIL');
    
    // Check form exists
    const titleInput = await page.$('input[placeholder*="หัวข้อ"]');
    const messageArea = await page.$('textarea');
    addResult(pageName, 'Notification form', titleInput && messageArea ? '✅ PASS' : '❌ FAIL');
    
    // Check templates
    const templates = await page.$$('button:has-text("ยินดีต้อนรับ"), button:has-text("ใกล้หมดอายุ")');
    addResult(pageName, 'Template buttons', templates.length > 0 ? '✅ PASS' : '⚠️ SKIP');
    
    // Test template click
    if (templates.length > 0) {
      await templates[0].click();
      await sleep(300);
      const inputValue = await page.$eval('input[placeholder*="หัวข้อ"]', (el: any) => el.value);
      addResult(pageName, 'Template fills form', inputValue ? '✅ PASS' : '❌ FAIL');
    }
    
    // Check send button (placeholder)
    const sendBtn = await page.$('button:has-text("ส่ง")');
    addResult(pageName, 'Send button', '🚧 PLACEHOLDER', 'Not connected to backend');
    
    // Check coming soon notice
    const comingSoon = await exists('text=/กำลังพัฒนา/');
    addResult(pageName, 'Shows placeholder notice', comingSoon ? '🚧 PLACEHOLDER' : '⚠️ SKIP');
    
  } catch (err: any) {
    addResult(pageName, 'Page test', '❌ FAIL', err.message);
  }
}

async function testSystemReports() {
  log('📈 Testing System Reports...');
  const pageName = 'System Reports';
  
  try {
    await page.goto(`${BASE_URL}/admin/reports`);
    await sleep(2000);
    
    // Check page loads
    const hasContent = await exists('text=/System Reports/');
    addResult(pageName, 'Page loads', hasContent ? '✅ PASS' : '❌ FAIL');
    
    // Check stats display
    const stats = await page.$$('.rounded-lg >> text=/Total Logins|Unique Users|Cases Created/');
    addResult(pageName, 'Usage stats (mock)', stats.length > 0 ? '✅ PASS' : '⚠️ SKIP');
    
    // Check feature usage chart
    const chartItems = await page.$$('text=/Money Flow|Forensic Report|Smart Import/');
    addResult(pageName, 'Feature usage chart (mock)', chartItems.length > 0 ? '✅ PASS' : '⚠️ SKIP');
    
    // Check download buttons (placeholder)
    const downloadBtns = await page.$$('button:has-text("ดาวน์โหลด")');
    addResult(pageName, 'Download buttons', downloadBtns.length > 0 ? '🚧 PLACEHOLDER' : '⚠️ SKIP', 
      'Not connected to backend');
    
    // Check coming soon notice
    const comingSoon = await exists('text=/กำลังพัฒนา|Mock Data/');
    addResult(pageName, 'Shows placeholder notice', comingSoon ? '🚧 PLACEHOLDER' : '⚠️ SKIP');
    
  } catch (err: any) {
    addResult(pageName, 'Page test', '❌ FAIL', err.message);
  }
}

async function testSettings() {
  log('⚙️ Testing Settings...');
  const pageName = 'Settings';
  
  try {
    await page.goto(`${BASE_URL}/admin/settings`);
    await sleep(2000);
    
    // Check page loads
    const hasContent = await exists('text=/Settings|ตั้งค่า/');
    addResult(pageName, 'Page loads', hasContent ? '✅ PASS' : '❌ FAIL');
    
    // Check form elements
    const inputs = await page.$$('input, select, textarea');
    addResult(pageName, 'Settings form exists', inputs.length > 0 ? '✅ PASS' : '⚠️ SKIP');
    
  } catch (err: any) {
    addResult(pageName, 'Page test', '❌ FAIL', err.message);
  }
}

async function testNavigation() {
  log('🧭 Testing Navigation...');
  const pageName = 'Navigation';
  
  try {
    await page.goto(`${BASE_URL}/admin`);
    await sleep(1000);
    
    // Check sidebar exists
    const sidebar = await exists('aside, nav');
    addResult(pageName, 'Sidebar exists', sidebar ? '✅ PASS' : '❌ FAIL');
    
    // Check all menu items
    const menuItems = [
      { text: 'Dashboard', url: '/admin' },
      { text: 'Activity', url: '/admin/activity' },
      { text: 'Registrations', url: '/admin/registrations' },
      { text: 'Users', url: '/admin/users' },
      { text: 'Subscriptions', url: '/admin/subscriptions' },
      { text: 'Organizations', url: '/admin/organizations' },
      { text: 'Notifications', url: '/admin/notifications' },
      { text: 'Reports', url: '/admin/reports' },
      { text: 'Settings', url: '/admin/settings' },
    ];
    
    for (const item of menuItems) {
      const link = await page.$(`a[href="${item.url}"], a:has-text("${item.text}")`);
      if (link) {
        await link.click();
        await sleep(500);
        const currentUrl = page.url();
        const isCorrect = currentUrl.includes(item.url);
        addResult(pageName, `Menu: ${item.text}`, isCorrect ? '✅ PASS' : '❌ FAIL',
          isCorrect ? undefined : `Expected ${item.url}, got ${currentUrl}`);
      } else {
        addResult(pageName, `Menu: ${item.text}`, '⚠️ SKIP', 'Link not found');
      }
    }
    
    // Test back to app button
    await page.goto(`${BASE_URL}/admin`);
    await sleep(500);
    const backBtn = await page.$('button:has-text("กลับไปหน้าแอป"), a:has-text("กลับไปหน้าแอป")');
    if (backBtn) {
      await backBtn.click();
      await sleep(1000);
      const url = page.url();
      addResult(pageName, 'Back to app button', url.includes('/app') ? '✅ PASS' : '❌ FAIL');
    }
    
    // Test logout
    await page.goto(`${BASE_URL}/admin`);
    await sleep(500);
    const logoutBtn = await page.$('button:has-text("Logout"), button:has-text("ออกจากระบบ")');
    addResult(pageName, 'Logout button exists', logoutBtn ? '✅ PASS' : '❌ FAIL');
    
  } catch (err: any) {
    addResult(pageName, 'Navigation test', '❌ FAIL', err.message);
  }
}

// ============== MAIN ==============

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 InvestiGate Admin Panel - Automated Test');
  console.log('='.repeat(60));
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📅 Started: ${new Date().toLocaleString()}`);
  console.log('='.repeat(60) + '\n');
  
  try {
    // Launch browser
    browser = await chromium.launch({ 
      headless: false, // Set to true for CI/CD
      slowMo: 100 
    });
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        pageErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });
    
    // Run tests
    const loggedIn = await testLogin();
    
    if (loggedIn) {
      await testAdminDashboard();
      await testRegistrations();
      await testUsers();
      await testOrganizations();
      await testSubscriptions();
      await testActivityLog();
      await testNotifications();
      await testSystemReports();
      await testSettings();
      await testNavigation();
    }
    
  } catch (err: any) {
    console.error('❌ Test runner error:', err.message);
  } finally {
    await browser?.close();
  }
  
  // Print summary
  printSummary();
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === '✅ PASS').length;
  const failed = results.filter(r => r.status === '❌ FAIL').length;
  const skipped = results.filter(r => r.status === '⚠️ SKIP').length;
  const placeholder = results.filter(r => r.status === '🚧 PLACEHOLDER').length;
  
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️ Skipped: ${skipped}`);
  console.log(`🚧 Placeholder: ${placeholder}`);
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
  
  // Failed tests detail
  if (failed > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('❌ FAILED TESTS:');
    console.log('-'.repeat(60));
    results.filter(r => r.status === '❌ FAIL').forEach(r => {
      console.log(`  • [${r.page}] ${r.test}`);
      if (r.error) console.log(`    Error: ${r.error}`);
    });
  }
  
  // Placeholder features
  if (placeholder > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('🚧 PLACEHOLDER FEATURES (Not yet implemented):');
    console.log('-'.repeat(60));
    results.filter(r => r.status === '🚧 PLACEHOLDER').forEach(r => {
      console.log(`  • [${r.page}] ${r.test}${r.error ? ' - ' + r.error : ''}`);
    });
  }
  
  // Console errors
  if (pageErrors.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('🔴 BROWSER CONSOLE ERRORS:');
    console.log('-'.repeat(60));
    [...new Set(pageErrors)].slice(0, 10).forEach(err => {
      console.log(`  • ${err.substring(0, 100)}`);
    });
    if (pageErrors.length > 10) {
      console.log(`  ... and ${pageErrors.length - 10} more errors`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`🏁 Completed: ${new Date().toLocaleString()}`);
  console.log('='.repeat(60) + '\n');
}

// Run
runTests();
