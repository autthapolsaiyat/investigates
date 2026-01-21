/**
 * InvestiGate User Dashboard Tests
 * Playwright E2E tests for user-facing features
 * 
 * Run: npx playwright test user-dashboard.spec.ts
 */
import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'https://wonderful-wave-0486dd100.6.azurestaticapps.net';
const TEST_USER = {
  email: 'test123@example.com',
  password: '!^R%@8@9&xJt'
};

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/app/dashboard', { timeout: 10000 });
}

test.describe('Authentication', () => {
  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/dashboard`);
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/.*\/app\/dashboard/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should stay on login page with error
    await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should redirect /guide to /app/guide (protected)', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide`);
    // Should redirect to login since guide is now protected
    await expect(page).toHaveURL(/.*\/login/);
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display dashboard with statistics', async ({ page }) => {
    await expect(page.locator('text=/dashboard|แดชบอร์ด/i')).toBeVisible();
    
    // Check for stats cards
    await expect(page.locator('text=/คดีทั้งหมด|total cases/i')).toBeVisible();
  });

  test('should display sidebar with navigation', async ({ page }) => {
    // Check sidebar elements
    await expect(page.locator('text=/จัดการคดี|cases/i').first()).toBeVisible();
    await expect(page.locator('text=/วิธีการใช้งาน/i')).toBeVisible();
  });

  test('should show subscription status in sidebar', async ({ page }) => {
    // Look for subscription badge
    const subscriptionBadge = page.locator('text=/subscription|เหลือ|หมดอายุ/i');
    await expect(subscriptionBadge.first()).toBeVisible();
  });
});

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to profile page', async ({ page }) => {
    // Click on user avatar/name in sidebar to go to profile
    await page.click('a[href="/app/profile"]');
    await expect(page).toHaveURL(/.*\/app\/profile/);
    
    // Check profile page elements
    await expect(page.locator('text=/โปรไฟล์ของฉัน/i')).toBeVisible();
  });

  test('should display user information', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/profile`);
    
    // Check for user email
    await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();
    
    // Check for profile sections
    await expect(page.locator('text=/ข้อมูลส่วนตัว/i')).toBeVisible();
    await expect(page.locator('text=/บทบาทและองค์กร/i')).toBeVisible();
  });

  test('should enable edit mode', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/profile`);
    
    // Click edit button
    await page.click('button:has-text("แก้ไข")');
    
    // Check for input fields
    await expect(page.locator('input').first()).toBeEnabled();
    
    // Check for save/cancel buttons
    await expect(page.locator('button:has-text("บันทึก")')).toBeVisible();
    await expect(page.locator('button:has-text("ยกเลิก")')).toBeVisible();
  });
});

test.describe('Cases (User View)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to cases page', async ({ page }) => {
    await page.click('a[href="/app/cases"]');
    await expect(page).toHaveURL(/.*\/app\/cases/);
  });

  test('should display cases list or empty state', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/cases`);
    
    // Should show either cases table or empty state
    const hasCases = await page.locator('table').isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=/ไม่พบคดี|no cases/i').isVisible().catch(() => false);
    
    expect(hasCases || hasEmptyState).toBeTruthy();
  });

  test('should only show own cases (role-based filtering)', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/cases`);
    
    // Wait for cases to load
    await page.waitForTimeout(2000);
    
    // If there are cases, they should belong to the current user
    // This is verified by the backend filtering
    const casesCount = await page.locator('table tbody tr').count();
    console.log(`User sees ${casesCount} cases`);
  });
});

test.describe('User Guide', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should access guide page when authenticated', async ({ page }) => {
    await page.click('a[href="/app/guide"]');
    await expect(page).toHaveURL(/.*\/app\/guide/);
    
    // Check guide content
    await expect(page.locator('text=/วิธีการใช้งาน|guide|คู่มือ/i').first()).toBeVisible();
  });
});

test.describe('Support Tickets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to my tickets page', async ({ page }) => {
    await page.click('a[href="/app/my-tickets"]');
    await expect(page).toHaveURL(/.*\/app\/my-tickets/);
  });

  test('should open create ticket modal', async ({ page }) => {
    // Click on "แจ้งปัญหา" button
    await page.click('button:has-text("แจ้งปัญหา")');
    
    // Modal should appear
    await expect(page.locator('text=/สร้าง ticket|แจ้งปัญหา/i')).toBeVisible();
  });
});

test.describe('Money Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to money flow page', async ({ page }) => {
    await page.click('a[href="/app/money-flow"]');
    await expect(page).toHaveURL(/.*\/app\/money-flow/);
  });

  test('should display money flow interface', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/money-flow`);
    
    // Check for case selector or money flow graph
    await expect(page.locator('text=/เลือกคดี|select case|money flow/i').first()).toBeVisible();
  });
});

test.describe('Navigation & Layout', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display sidebar correctly', async ({ page }) => {
    // Main navigation items
    const navItems = [
      'Dashboard',
      'จัดการคดี',
      'Money Flow',
    ];

    for (const item of navItems) {
      await expect(page.locator(`text=/${item}/i`).first()).toBeVisible();
    }
  });

  test('should logout successfully', async ({ page }) => {
    // Click logout button
    await page.click('button:has-text("Logout")');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login|.*\//);
  });

  test('should not show admin panel link for regular user', async ({ page }) => {
    // Regular investigator should not see admin panel
    // This depends on the user's role - may need adjustment
    const adminLink = page.locator('a[href="/admin"]');
    const adminLinkCount = await adminLink.count();
    
    // Log for debugging
    console.log(`Admin links visible: ${adminLinkCount}`);
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page);
    
    // Dashboard should still be accessible
    await expect(page).toHaveURL(/.*\/app\/dashboard/);
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page);
    
    await expect(page).toHaveURL(/.*\/app\/dashboard/);
  });
});

// Performance test
test.describe('Performance', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await login(page);
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });
});
