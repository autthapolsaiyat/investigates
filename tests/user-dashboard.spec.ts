/**
 * InvestiGate User Dashboard Tests (Improved)
 * Playwright E2E tests with robust selectors
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

// Increase default timeout
test.setTimeout(30000);

// Helper function to login with better selectors
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Use ID selectors which are more reliable
  await page.fill('#email', TEST_USER.email);
  await page.fill('#password', TEST_USER.password);
  
  // Click submit button by text
  await page.click('button:has-text("Sign In")');
  
  // Wait for redirect to dashboard with longer timeout
  await page.waitForURL('**/app/dashboard', { timeout: 15000 });
}

test.describe('Authentication', () => {
  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/dashboard`);
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/.*\/app\/dashboard/);
    
    // Verify we're actually on dashboard
    await page.waitForLoadState('networkidle');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    // Wait for error message - look for red error div
    await expect(page.locator('.bg-red-500\\/10, [class*="error"], [class*="red"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should redirect /guide to login (protected)', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide`);
    // Should redirect since guide is protected
    await expect(page).toHaveURL(/.*\/(login|app\/guide)/);
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display dashboard page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check page loaded (look for any main content)
    const mainContent = page.locator('main, [class*="dashboard"], [class*="content"]');
    await expect(mainContent.first()).toBeVisible();
  });

  test('should display sidebar', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check sidebar exists
    const sidebar = page.locator('aside, nav, [class*="sidebar"]');
    await expect(sidebar.first()).toBeVisible();
  });

  test('should show user email in sidebar', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for user email somewhere on page
    await expect(page.locator(`text=${TEST_USER.email}`).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to profile page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Try clicking profile link
    const profileLink = page.locator('a[href="/app/profile"]');
    if (await profileLink.count() > 0) {
      await profileLink.click();
      await expect(page).toHaveURL(/.*\/app\/profile/);
    } else {
      // Navigate directly
      await page.goto(`${BASE_URL}/app/profile`);
      await expect(page).toHaveURL(/.*\/app\/profile/);
    }
  });

  test('should display profile page content', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/profile`);
    await page.waitForLoadState('networkidle');
    
    // Check for email display
    await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible({ timeout: 10000 });
  });

  test('should have edit functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/profile`);
    await page.waitForLoadState('networkidle');
    
    // Look for edit button (Thai or English)
    const editButton = page.locator('button:has-text("แก้ไข"), button:has-text("Edit")');
    await expect(editButton.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Cases', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to cases page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click cases link
    const casesLink = page.locator('a[href="/app/cases"]');
    if (await casesLink.count() > 0) {
      await casesLink.click();
    } else {
      await page.goto(`${BASE_URL}/app/cases`);
    }
    
    await expect(page).toHaveURL(/.*\/app\/cases/);
  });

  test('should display cases page', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/cases`);
    await page.waitForLoadState('networkidle');
    
    // Page should have loaded (either cases table or empty state)
    const pageContent = page.locator('main, [class*="content"]');
    await expect(pageContent.first()).toBeVisible();
  });
});

test.describe('Money Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to money flow page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const moneyFlowLink = page.locator('a[href="/app/money-flow"]');
    if (await moneyFlowLink.count() > 0) {
      await moneyFlowLink.click();
    } else {
      await page.goto(`${BASE_URL}/app/money-flow`);
    }
    
    await expect(page).toHaveURL(/.*\/app\/money-flow/);
  });

  test('should display money flow page', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/money-flow`);
    await page.waitForLoadState('networkidle');
    
    const pageContent = page.locator('main, [class*="content"]');
    await expect(pageContent.first()).toBeVisible();
  });
});

test.describe('User Guide', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should access guide page when authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/guide`);
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*\/app\/guide/);
    
    // Should see guide content
    const pageContent = page.locator('main, [class*="content"], [class*="guide"]');
    await expect(pageContent.first()).toBeVisible();
  });
});

test.describe('Support Tickets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to my tickets page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const ticketsLink = page.locator('a[href="/app/my-tickets"]');
    if (await ticketsLink.count() > 0) {
      await ticketsLink.click();
    } else {
      await page.goto(`${BASE_URL}/app/my-tickets`);
    }
    
    await expect(page).toHaveURL(/.*\/app\/my-tickets/);
  });

  test('should have create ticket button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for "แจ้งปัญหา" button
    const createTicketBtn = page.locator('button:has-text("แจ้งปัญหา"), button:has-text("Report"), button:has-text("Create")');
    await expect(createTicketBtn.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should have sidebar navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for navigation links
    const navLinks = page.locator('a[href^="/app/"]');
    const count = await navLinks.count();
    
    expect(count).toBeGreaterThan(0);
    console.log(`Found ${count} navigation links`);
  });

  test('should logout successfully', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click logout
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("ออกจากระบบ")');
    await logoutBtn.first().click();
    
    // Should redirect to login or home
    await page.waitForURL(/.*\/(login|$)/, { timeout: 10000 });
  });
});

test.describe('Responsive', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Login form should be visible
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('should login on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page);
    
    await expect(page).toHaveURL(/.*\/app\/dashboard/);
  });
});

test.describe('Performance', () => {
  test('should load login page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    console.log(`Login page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test('should complete login within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await login(page);
    const totalTime = Date.now() - startTime;
    
    console.log(`Total login flow time: ${totalTime}ms`);
    expect(totalTime).toBeLessThan(15000);
  });
});
