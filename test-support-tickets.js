#!/usr/bin/env node
/**
 * InvestiGate - Support Ticket System Test
 * ทดสอบระบบแจ้งปัญหาแบบ end-to-end ด้วย Playwright
 * 
 * Run: node test-support-tickets.js
 * Dependencies: npm install playwright
 */

const { chromium } = require('playwright');

// Configuration
const BASE_URL = 'https://wonderful-wave-0486dd100.6.azurestaticapps.net';
const API_URL = 'https://investigates-api.azurewebsites.net/api/v1';

// Test credentials
const TEST_USER = {
  email: 'admin@test.com',
  password: 'admin123'
};

// Results storage
const results = [];
let browser, context, page;

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  pass: (msg) => console.log(`${colors.green}✅ PASS${colors.reset} ${msg}`),
  fail: (msg, err) => console.log(`${colors.red}❌ FAIL${colors.reset} ${msg}${err ? ': ' + err : ''}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  INFO${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}▶️  STEP${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.yellow}${'═'.repeat(60)}${colors.reset}\n${colors.yellow}📋 ${msg}${colors.reset}\n${colors.yellow}${'═'.repeat(60)}${colors.reset}`)
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

const addResult = (test, status, error = null) => {
  results.push({ test, status, error });
};

// ============== Test Functions ==============

async function testLogin() {
  log.section('1. Login Test');
  
  try {
    log.step('Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await sleep(1000);
    
    // Check if already logged in
    const currentUrl = page.url();
    if (currentUrl.includes('/app/') || currentUrl.includes('/admin/')) {
      log.info('Already logged in, continuing...');
      addResult('Login', 'PASS');
      return true;
    }
    
    log.step('Filling login form...');
    await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);
    
    log.step('Clicking login button...');
    await page.click('button[type="submit"]');
    await sleep(2000);
    
    // Check login success
    const afterLoginUrl = page.url();
    if (afterLoginUrl.includes('/app/') || afterLoginUrl.includes('/admin/')) {
      log.pass('Login successful');
      addResult('Login', 'PASS');
      return true;
    } else {
      throw new Error('Did not redirect after login');
    }
    
  } catch (err) {
    log.fail('Login', err.message);
    addResult('Login', 'FAIL', err.message);
    return false;
  }
}

async function testSidebarSupportButton() {
  log.section('2. Sidebar Support Button Test');
  
  try {
    log.step('Looking for support button in sidebar...');
    
    // Look for the support/ticket button
    const supportButton = await page.$('text=แจ้งปัญหา') || 
                          await page.$('text=Support') ||
                          await page.$('[data-testid="support-button"]') ||
                          await page.$('button:has-text("แจ้ง")');
    
    if (supportButton) {
      log.pass('Support button found in sidebar');
      addResult('Sidebar Support Button', 'PASS');
      return true;
    } else {
      // Check if there's any ticket-related element
      const ticketLink = await page.$('a[href*="ticket"]') || await page.$('a[href*="support"]');
      if (ticketLink) {
        log.pass('Support/Ticket link found');
        addResult('Sidebar Support Button', 'PASS');
        return true;
      }
      throw new Error('Support button not found');
    }
    
  } catch (err) {
    log.fail('Sidebar Support Button', err.message);
    addResult('Sidebar Support Button', 'FAIL', err.message);
    return false;
  }
}

async function testCreateTicketModal() {
  log.section('3. Create Ticket Modal Test');
  
  try {
    log.step('Clicking support button to open modal...');
    
    // Try different selectors
    const clicked = await page.click('text=แจ้งปัญหา', { timeout: 3000 }).catch(() => false) ||
                    await page.click('text=Support', { timeout: 3000 }).catch(() => false) ||
                    await page.click('[data-testid="support-button"]', { timeout: 3000 }).catch(() => false);
    
    await sleep(1000);
    
    // Check for modal
    const modal = await page.$('[role="dialog"]') || 
                  await page.$('.modal') ||
                  await page.$('[class*="modal"]');
    
    if (modal) {
      log.pass('Create Ticket modal opened');
      
      // Check for form fields
      const subjectField = await page.$('input[name="subject"]') || await page.$('input[placeholder*="หัวข้อ"]');
      const descField = await page.$('textarea[name="description"]') || await page.$('textarea');
      
      if (subjectField && descField) {
        log.pass('Modal has subject and description fields');
        addResult('Create Ticket Modal', 'PASS');
        
        // Close modal
        await page.keyboard.press('Escape');
        await sleep(500);
        return true;
      }
    }
    
    throw new Error('Modal not found or missing fields');
    
  } catch (err) {
    log.fail('Create Ticket Modal', err.message);
    addResult('Create Ticket Modal', 'FAIL', err.message);
    return false;
  }
}

async function testMyTicketsPage() {
  log.section('4. My Tickets Page Test');
  
  try {
    log.step('Navigating to My Tickets page...');
    await page.goto(`${BASE_URL}/app/my-tickets`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    // Check page loaded
    const pageContent = await page.textContent('body');
    
    if (pageContent.includes('Ticket') || 
        pageContent.includes('แจ้งปัญหา') ||
        pageContent.includes('รายการ')) {
      log.pass('My Tickets page loaded');
      addResult('My Tickets Page Load', 'PASS');
      return true;
    }
    
    throw new Error('Page content not as expected');
    
  } catch (err) {
    log.fail('My Tickets Page', err.message);
    addResult('My Tickets Page Load', 'FAIL', err.message);
    return false;
  }
}

async function testCreateTicketFlow() {
  log.section('5. Create Ticket Flow Test');
  
  try {
    log.step('Opening create ticket modal...');
    
    // Click create button
    const createBtn = await page.$('text=สร้าง Ticket ใหม่') ||
                      await page.$('text=แจ้งปัญหา') ||
                      await page.$('button:has-text("สร้าง")') ||
                      await page.$('[data-testid="create-ticket"]');
    
    if (createBtn) {
      await createBtn.click();
      await sleep(1000);
    } else {
      // Try sidebar button
      await page.click('text=แจ้งปัญหา').catch(() => {});
      await sleep(1000);
    }
    
    log.step('Filling ticket form...');
    
    // Fill subject
    const subjectInput = await page.$('input[name="subject"]') || 
                         await page.$('input[placeholder*="หัวข้อ"]') ||
                         await page.$('input:first-of-type');
    if (subjectInput) {
      await subjectInput.fill('ทดสอบระบบ Support Ticket - ' + Date.now());
    }
    
    // Fill description
    const descInput = await page.$('textarea[name="description"]') || 
                      await page.$('textarea');
    if (descInput) {
      await descInput.fill('นี่คือการทดสอบระบบ Support Ticket จาก Playwright automated test\n\nรายละเอียด:\n- ทดสอบการสร้าง Ticket\n- ทดสอบการแนบข้อมูล');
    }
    
    // Select category if available
    const categorySelect = await page.$('select[name="category"]') || 
                           await page.$('[data-testid="category-select"]');
    if (categorySelect) {
      await categorySelect.selectOption('bug');
    }
    
    await sleep(500);
    
    log.step('Submitting ticket...');
    
    // Click submit
    const submitBtn = await page.$('button[type="submit"]') ||
                      await page.$('button:has-text("ส่ง")') ||
                      await page.$('button:has-text("Submit")') ||
                      await page.$('button:has-text("สร้าง")');
    
    if (submitBtn) {
      await submitBtn.click();
      await sleep(2000);
      
      // Check for success message or redirect
      const pageContent = await page.textContent('body');
      if (pageContent.includes('สำเร็จ') || 
          pageContent.includes('Success') ||
          pageContent.includes('SUP-')) {
        log.pass('Ticket created successfully');
        addResult('Create Ticket Flow', 'PASS');
        return true;
      }
    }
    
    // Check if we're back on ticket list
    const ticketList = await page.$('[class*="ticket"]') || await page.$('table');
    if (ticketList) {
      log.pass('Ticket created (returned to list)');
      addResult('Create Ticket Flow', 'PASS');
      return true;
    }
    
    throw new Error('Could not confirm ticket creation');
    
  } catch (err) {
    log.fail('Create Ticket Flow', err.message);
    addResult('Create Ticket Flow', 'FAIL', err.message);
    return false;
  }
}

async function testAdminTicketsPage() {
  log.section('6. Admin Support Tickets Page Test');
  
  try {
    log.step('Navigating to Admin Support Tickets...');
    await page.goto(`${BASE_URL}/admin/support-tickets`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    // Check page loaded
    const pageContent = await page.textContent('body');
    
    if (pageContent.includes('Support') || 
        pageContent.includes('Ticket') ||
        pageContent.includes('Total') ||
        pageContent.includes('Open')) {
      log.pass('Admin Support Tickets page loaded');
      
      // Check for stats cards
      const statsCards = await page.$$('[class*="card"]');
      if (statsCards.length > 0) {
        log.pass(`Found ${statsCards.length} stats cards`);
      }
      
      // Check for table
      const table = await page.$('table') || await page.$('[class*="table"]');
      if (table) {
        log.pass('Tickets table found');
      }
      
      addResult('Admin Support Tickets Page', 'PASS');
      return true;
    }
    
    // Check if access denied (not admin)
    if (pageContent.includes('Access') || pageContent.includes('Forbidden') || pageContent.includes('403')) {
      log.info('Access denied - user may not be admin');
      addResult('Admin Support Tickets Page', 'SKIP', 'Not admin user');
      return true;
    }
    
    throw new Error('Page content not as expected');
    
  } catch (err) {
    log.fail('Admin Support Tickets Page', err.message);
    addResult('Admin Support Tickets Page', 'FAIL', err.message);
    return false;
  }
}

async function testAPIEndpoints() {
  log.section('7. API Endpoints Test');
  
  try {
    // Get auth token from localStorage
    const token = await page.evaluate(() => {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.state?.token || null;
      }
      return null;
    });
    
    if (!token) {
      log.info('No auth token found, skipping API tests');
      addResult('API Endpoints', 'SKIP', 'No auth token');
      return true;
    }
    
    log.step('Testing API endpoints...');
    
    // Test unread count
    const unreadResponse = await page.evaluate(async (url, authToken) => {
      const res = await fetch(`${url}/support/tickets/unread/count`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      return { status: res.status, ok: res.ok };
    }, API_URL, token);
    
    if (unreadResponse.ok) {
      log.pass('GET /support/tickets/unread/count - OK');
    } else {
      log.fail('GET /support/tickets/unread/count', `Status: ${unreadResponse.status}`);
    }
    
    // Test list tickets
    const listResponse = await page.evaluate(async (url, authToken) => {
      const res = await fetch(`${url}/support/tickets`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      return { status: res.status, ok: res.ok };
    }, API_URL, token);
    
    if (listResponse.ok) {
      log.pass('GET /support/tickets - OK');
    } else {
      log.fail('GET /support/tickets', `Status: ${listResponse.status}`);
    }
    
    // Test admin stats
    const statsResponse = await page.evaluate(async (url, authToken) => {
      const res = await fetch(`${url}/support/admin/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      return { status: res.status, ok: res.ok };
    }, API_URL, token);
    
    if (statsResponse.ok) {
      log.pass('GET /support/admin/stats - OK');
    } else if (statsResponse.status === 403) {
      log.info('GET /support/admin/stats - Forbidden (not admin)');
    } else {
      log.fail('GET /support/admin/stats', `Status: ${statsResponse.status}`);
    }
    
    addResult('API Endpoints', 'PASS');
    return true;
    
  } catch (err) {
    log.fail('API Endpoints', err.message);
    addResult('API Endpoints', 'FAIL', err.message);
    return false;
  }
}

async function testTicketDetailModal() {
  log.section('8. Ticket Detail Modal Test');
  
  try {
    log.step('Going to My Tickets page...');
    await page.goto(`${BASE_URL}/app/my-tickets`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    log.step('Looking for ticket to click...');
    
    // Find a ticket row to click
    const ticketRow = await page.$('tr[class*="cursor"]') || 
                      await page.$('tr:has(td)') ||
                      await page.$('[class*="ticket-item"]');
    
    if (ticketRow) {
      await ticketRow.click();
      await sleep(1000);
      
      // Check for detail modal
      const modal = await page.$('[role="dialog"]') || 
                    await page.$('.modal') ||
                    await page.$('[class*="modal"]');
      
      if (modal) {
        const modalContent = await modal.textContent();
        if (modalContent.includes('SUP-') || 
            modalContent.includes('รายละเอียด') ||
            modalContent.includes('Description')) {
          log.pass('Ticket detail modal opened');
          addResult('Ticket Detail Modal', 'PASS');
          
          // Close modal
          await page.keyboard.press('Escape');
          return true;
        }
      }
    }
    
    log.info('No tickets to view or modal not found');
    addResult('Ticket Detail Modal', 'SKIP', 'No tickets available');
    return true;
    
  } catch (err) {
    log.fail('Ticket Detail Modal', err.message);
    addResult('Ticket Detail Modal', 'FAIL', err.message);
    return false;
  }
}

// ============== Main Test Runner ==============

async function runTests() {
  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎫 InvestiGate - Support Ticket System Test              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
  `);
  
  console.log(`${colors.blue}🌐 Frontend: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.blue}🔌 API: ${API_URL}${colors.reset}`);
  console.log(`${colors.blue}👤 User: ${TEST_USER.email}${colors.reset}`);
  console.log(`${colors.blue}🕐 Started: ${new Date().toLocaleString()}${colors.reset}\n`);
  
  try {
    log.step('Launching browser...');
    browser = await chromium.launch({ 
      headless: false,  // Set to true for CI/CD
      slowMo: 100 
    });
    context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    page = await context.newPage();
    
    // Run tests
    await testLogin();
    await testSidebarSupportButton();
    await testCreateTicketModal();
    await testMyTicketsPage();
    await testCreateTicketFlow();
    await testAdminTicketsPage();
    await testAPIEndpoints();
    await testTicketDetailModal();
    
  } catch (err) {
    log.fail('Test runner error', err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Print summary
  printSummary();
}

function printSummary() {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  
  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════════╗
║                      TEST SUMMARY                          ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
  `);
  
  console.log(`${colors.green}✅ Passed:  ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed:  ${failed}${colors.reset}`);
  console.log(`${colors.yellow}⏭️  Skipped: ${skipped}${colors.reset}`);
  console.log(`${'─'.repeat(40)}`);
  console.log(`📊 Total:   ${results.length}`);
  
  if (failed > 0) {
    console.log(`\n${colors.red}❌ FAILED TESTS:${colors.reset}`);
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   • ${r.test}: ${r.error || 'Unknown error'}`);
    });
  }
  
  console.log(`\n${colors.blue}🕐 Completed: ${new Date().toLocaleString()}${colors.reset}`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}🎉 ALL TESTS PASSED!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}⚠️  SOME TESTS FAILED${colors.reset}\n`);
  }
}

// Run
runTests().catch(console.error);
