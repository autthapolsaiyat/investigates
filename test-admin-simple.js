#!/usr/bin/env node
/**
 * InvestiGate Admin Panel - Simple Test Script
 * Run: node test-admin-simple.js
 * 
 * Dependencies: npm install playwright
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
      addResult('Login', 'Admin login', '✅ PASS');
      return true;
    }
    addResult('Login', 'Admin login', '❌ FAIL', 'No redirect');
    return false;
  } catch (e) {
    addResult('Login', 'Admin login', '❌ FAIL', e.message);
    return false;
  }
}

async function testPage(name, url, checks) {
  console.log(`\n📄 ${name}...`);
  try {
    await page.goto(`${BASE_URL}${url}`);
    await sleep(2000);
    
    for (const check of checks) {
      try {
        const result = await check.fn();
        addResult(name, check.name, result ? '✅ PASS' : (check.optional ? '⚠️ SKIP' : '❌ FAIL'), 
          result ? null : check.failMsg);
      } catch (e) {
        addResult(name, check.name, check.placeholder ? '🚧 PLACEHOLDER' : '❌ FAIL', e.message);
      }
    }
  } catch (e) {
    addResult(name, 'Page load', '❌ FAIL', e.message);
  }
}

// ============== MAIN ==============

async function run() {
  console.log('═'.repeat(60));
  console.log('🧪 InvestiGate Admin Panel Test');
  console.log('═'.repeat(60));
  console.log(`🌐 ${BASE_URL}`);
  console.log(`⏰ ${new Date().toLocaleString()}`);
  
  browser = await chromium.launch({ headless: false, slowMo: 50 });
  page = await browser.newPage();
  
  // Capture errors
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  
  const loggedIn = await login();
  if (!loggedIn) {
    await browser.close();
    return;
  }
  
  // Test each page
  await testPage('Dashboard', '/admin', [
    { name: 'Page loads', fn: () => exists('h1') },
    { name: 'Stats cards', fn: async () => (await page.$$('text=/ผู้ใช้|รอการอนุมัติ|หน่วยงาน|คดี/')).length >= 2 },
    { name: 'Refresh button', fn: () => exists('button:has-text("รีเฟรช")') },
    { name: 'Quick actions', fn: async () => (await page.$$('text=/ดูคำขอ|จัดการผู้ใช้/')).length > 0, optional: true },
  ]);
  
  await testPage('Registrations', '/admin/registrations', [
    { name: 'Page loads', fn: () => exists('text=/Registrations|คำขอลงทะเบียน/i') },
    { name: 'Stats cards', fn: async () => (await page.$$('.rounded-lg')).length >= 3, optional: true },
    { name: 'Search input', fn: () => exists('input[placeholder*="Search"], input[placeholder*="ค้นหา"]') },
    { name: 'Filter dropdown', fn: () => exists('select') },
    { name: 'Registration list', fn: () => exists('[class*="divide-y"]'), optional: true },
  ]);
  
  await testPage('Users', '/admin/users', [
    { name: 'Page loads', fn: () => exists('text=/Users/i') },
    { name: 'User list', fn: async () => (await page.$$('[class*="divide-y"] > div, table tbody tr')).length > 0, optional: true },
    { name: 'Search input', fn: () => exists('input[placeholder*="Search"], input[placeholder*="ค้นหา"]') },
    { name: 'Add button', fn: () => exists('button:has-text("New User"), button:has-text("Add"), button:has-text("เพิ่ม")') },
  ]);
  
  await testPage('Organizations', '/admin/organizations', [
    { name: 'Page loads', fn: () => exists('text=/Organizations|หน่วยงาน/i') },
    { name: 'Org list', fn: async () => (await page.$$('[class*="divide-y"] > div, table tbody tr')).length > 0, optional: true },
    { name: 'Search input', fn: () => exists('input[placeholder*="Search"], input[placeholder*="ค้นหา"]') },
    { name: 'Add button', fn: () => exists('button:has-text("New Organization"), button:has-text("New"), button:has-text("Add"), button:has-text("เพิ่ม")') },
  ]);
  
  await testPage('Subscriptions', '/admin/subscriptions', [
    { name: 'Page loads', fn: () => exists('text=/Subscriptions/i') },
    { name: 'Stats cards', fn: async () => (await page.$$('.rounded-lg')).length >= 3, optional: true },
    { name: 'User list', fn: () => exists('[class*="divide-y"]'), optional: true },
    { name: 'Renew button', fn: () => exists('button:has-text("ต่ออายุ")'), placeholder: true },
    { name: 'Coming soon notice', fn: () => exists('text=/กำลังพัฒนา/'), optional: true },
  ]);
  
  await testPage('Activity Log', '/admin/activity', [
    { name: 'Page loads', fn: () => exists('text=/Activity/i') },
    { name: 'Activity list (mock)', fn: () => exists('[class*="divide-y"]'), optional: true },
    { name: 'Placeholder notice', fn: () => exists('text=/กำลังพัฒนา/'), placeholder: true },
  ]);
  
  await testPage('Notifications', '/admin/notifications', [
    { name: 'Page loads', fn: () => exists('text=/Notifications/i') },
    { name: 'Title input', fn: () => exists('input') },
    { name: 'Message textarea', fn: () => exists('textarea') },
    { name: 'Templates', fn: async () => (await page.$$('button:has-text("ยินดีต้อนรับ")')).length > 0, optional: true },
    { name: 'Send button', fn: () => exists('button:has-text("ส่ง")'), placeholder: true },
  ]);
  
  await testPage('System Reports', '/admin/reports', [
    { name: 'Page loads', fn: () => exists('text=/Reports/i') },
    { name: 'Usage stats', fn: async () => (await page.$$('.rounded-lg')).length > 3, optional: true },
    { name: 'Download buttons', fn: () => exists('button:has-text("ดาวน์โหลด")'), placeholder: true },
  ]);
  
  await testPage('Settings', '/admin/settings', [
    { name: 'Page loads', fn: () => exists('text=/Settings|ตั้งค่า/i') },
    { name: 'Form exists', fn: async () => (await page.$$('input, select')).length > 0, optional: true },
  ]);
  
  // Test navigation
  console.log('\n🧭 Navigation...');
  await page.goto(`${BASE_URL}/admin`);
  await sleep(1000);
  
  const backBtn = await page.$('button:has-text("กลับ"), a:has-text("กลับ")');
  if (backBtn) {
    await backBtn.click();
    await sleep(1500);
    addResult('Navigation', 'Back to app', page.url().includes('/app') ? '✅ PASS' : '❌ FAIL');
  } else {
    addResult('Navigation', 'Back to app button', '❌ FAIL', 'Not found');
  }
  
  await browser.close();
  
  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));
  
  const pass = results.filter(r => r.status === '✅ PASS').length;
  const fail = results.filter(r => r.status === '❌ FAIL').length;
  const skip = results.filter(r => r.status === '⚠️ SKIP').length;
  const placeholder = results.filter(r => r.status === '🚧 PLACEHOLDER').length;
  
  console.log(`\n✅ Passed: ${pass}`);
  console.log(`❌ Failed: ${fail}`);
  console.log(`⚠️ Skipped: ${skip}`);
  console.log(`🚧 Placeholder: ${placeholder}`);
  
  if (fail > 0) {
    console.log('\n❌ FAILED:');
    results.filter(r => r.status === '❌ FAIL').forEach(r => {
      console.log(`  [${r.page}] ${r.test}: ${r.error || 'Unknown'}`);
    });
  }
  
  if (placeholder > 0) {
    console.log('\n🚧 NOT IMPLEMENTED YET:');
    results.filter(r => r.status === '🚧 PLACEHOLDER').forEach(r => {
      console.log(`  [${r.page}] ${r.test}`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\n🔴 BROWSER ERRORS:');
    [...new Set(errors)].slice(0, 5).forEach(e => console.log(`  • ${e.substring(0, 80)}`));
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(fail === 0 ? '🎉 ALL CORE TESTS PASSED!' : `⚠️ ${fail} tests failed`);
  console.log('═'.repeat(60));
}

run().catch(console.error);
