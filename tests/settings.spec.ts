/**
 * Settings Page - Playwright E2E Tests
 * ทดสอบทุก feature ของหน้า Settings
 */
import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'https://wonderful-wave-0486dd100.6.azurestaticapps.net';
const API_URL = 'https://investigates-api.azurewebsites.net/api/v1';

// Test accounts
const ADMIN_USER = {
  email: 'admin@test.com',
  password: 'admin123'
};

// Helper: Login
async function login(page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect after login
  await page.waitForURL(/\/(admin|app)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

// Helper: Navigate to Settings
async function goToSettings(page) {
  await page.goto(`${BASE_URL}/admin/settings`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1')).toContainText(/Settings|ตั้งค่า/);
}

// ============================================================
// TEST SUITE: Settings Page
// ============================================================

test.describe('Settings Page', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await goToSettings(page);
  });

  // ============================================================
  // Profile Tab Tests
  // ============================================================
  
  test.describe('Profile Tab', () => {
    
    test('should display profile form with user data', async ({ page }) => {
      // Profile tab should be active by default
      await expect(page.locator('button:has-text("Profile")')).toHaveClass(/primary/);
      
      // Check form fields exist
      await expect(page.locator('input').first()).toBeVisible();
      await expect(page.locator('text=First Name')).toBeVisible();
      await expect(page.locator('text=Last Name')).toBeVisible();
      await expect(page.locator('text=Email')).toBeVisible();
      await expect(page.locator('text=Phone')).toBeVisible();
    });

    test('should have disabled email field', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeDisabled();
      await expect(page.locator('text=Email cannot be changed')).toBeVisible();
    });

    test('should update profile successfully', async ({ page }) => {
      // Generate unique name to verify save
      const testPhone = `08${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
      
      // Fill phone field
      const phoneInput = page.locator('input[placeholder="Optional"], input[placeholder="ไม่บังคับ"]').first();
      await phoneInput.fill(testPhone);
      
      // Click Save
      await page.click('button:has-text("Save"), button:has-text("บันทึก")');
      
      // Wait for success
      await expect(page.locator('button:has-text("Saved"), button:has-text("บันทึกแล้ว")')).toBeVisible({ timeout: 5000 });
    });

    test('should show avatar section', async ({ page }) => {
      await expect(page.locator('text=Change Avatar, text=เปลี่ยนรูปโปรไฟล์')).toBeVisible();
      await expect(page.locator('text=JPG, PNG')).toBeVisible();
    });

    test('should have avatar upload button', async ({ page }) => {
      const uploadButton = page.locator('button:has-text("Change Avatar"), button:has-text("เปลี่ยนรูปโปรไฟล์")');
      await expect(uploadButton).toBeVisible();
      await expect(uploadButton).toBeEnabled();
    });
  });

  // ============================================================
  // Notifications Tab Tests
  // ============================================================
  
  test.describe('Notifications Tab', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.click('button:has-text("Notifications"), button:has-text("การแจ้งเตือน")');
      await page.waitForTimeout(500);
    });

    test('should display notification preferences', async ({ page }) => {
      await expect(page.locator('h2:has-text("Notification"), h2:has-text("การแจ้งเตือน")')).toBeVisible();
      
      // Check all toggles exist
      const toggles = page.locator('input[type="checkbox"]');
      const count = await toggles.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });

    test('should have Email Notifications toggle', async ({ page }) => {
      await expect(page.locator('text=Email Notifications, text=แจ้งเตือนทางอีเมล')).toBeVisible();
    });

    test('should have Push Notifications toggle', async ({ page }) => {
      await expect(page.locator('text=Push Notifications, text=การแจ้งเตือนแบบ Push')).toBeVisible();
    });

    test('should have Case Updates toggle', async ({ page }) => {
      await expect(page.locator('text=Case Updates, text=อัพเดทคดี')).toBeVisible();
    });

    test('should have Weekly Report toggle', async ({ page }) => {
      await expect(page.locator('text=Weekly Report, text=รายงานรายสัปดาห์')).toBeVisible();
    });

    test('should toggle notification preference', async ({ page }) => {
      // Find first toggle
      const firstToggle = page.locator('.peer').first();
      const initialState = await firstToggle.isChecked();
      
      // Click to toggle
      await firstToggle.click();
      
      // Verify state changed
      const newState = await firstToggle.isChecked();
      expect(newState).toBe(!initialState);
      
      // Toggle back
      await firstToggle.click();
    });

    test('should save notification preferences', async ({ page }) => {
      // Toggle something
      const toggle = page.locator('.peer').first();
      await toggle.click();
      
      // Save
      await page.click('button:has-text("Save"), button:has-text("บันทึก")');
      
      // Wait for success
      await expect(page.locator('button:has-text("Saved"), button:has-text("บันทึกแล้ว")')).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================================
  // Security Tab Tests
  // ============================================================
  
  test.describe('Security Tab', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.click('button:has-text("Security"), button:has-text("ความปลอดภัย")');
      await page.waitForTimeout(500);
    });

    test('should display security settings', async ({ page }) => {
      await expect(page.locator('h2:has-text("Security"), h2:has-text("ความปลอดภัย")')).toBeVisible();
    });

    test('should have password change form', async ({ page }) => {
      await expect(page.locator('text=Current Password, text=รหัสผ่านปัจจุบัน')).toBeVisible();
      await expect(page.locator('text=New Password, text=รหัสผ่านใหม่')).toBeVisible();
      await expect(page.locator('text=Confirm, text=ยืนยัน')).toBeVisible();
    });

    test('should have password visibility toggles', async ({ page }) => {
      // Find eye icons for show/hide password
      const eyeButtons = page.locator('button:has(svg)').filter({ hasText: '' });
      const count = await eyeButtons.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('should toggle password visibility', async ({ page }) => {
      const currentPasswordInput = page.locator('input[type="password"]').first();
      await currentPasswordInput.fill('testpassword');
      
      // Click eye icon to show password
      const eyeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      await eyeButton.click();
      
      // Input type should change to text
      await expect(page.locator('input[type="text"]').first()).toHaveValue('testpassword');
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.locator('input[type="password"]').nth(0).fill('currentpass');
      await page.locator('input[type="password"]').nth(1).fill('newpassword123');
      await page.locator('input[type="password"]').nth(2).fill('differentpass');
      
      await page.click('button:has-text("Change Password"), button:has-text("เปลี่ยนรหัสผ่าน")');
      
      // Should show error
      await expect(page.locator('text=do not match, text=ไม่ตรงกัน')).toBeVisible({ timeout: 3000 });
    });

    test('should show error for short password', async ({ page }) => {
      await page.locator('input[type="password"]').nth(0).fill('currentpass');
      await page.locator('input[type="password"]').nth(1).fill('short');
      await page.locator('input[type="password"]').nth(2).fill('short');
      
      await page.click('button:has-text("Change Password"), button:has-text("เปลี่ยนรหัสผ่าน")');
      
      // Should show error
      await expect(page.locator('text=8 characters, text=8 ตัวอักษร')).toBeVisible({ timeout: 3000 });
    });

    test('should have 2FA section', async ({ page }) => {
      await expect(page.locator('text=Two-Factor, text=การยืนยันตัวตนสองขั้นตอน')).toBeVisible();
      await expect(page.locator('button:has-text("Enable 2FA"), button:has-text("เปิดใช้งาน 2FA")')).toBeVisible();
    });

    test('should have disabled 2FA button with Coming Soon', async ({ page }) => {
      const button2FA = page.locator('button:has-text("Enable 2FA"), button:has-text("เปิดใช้งาน 2FA")');
      await expect(button2FA).toBeDisabled();
      await expect(page.locator('text=Coming Soon')).toBeVisible();
    });
  });

  // ============================================================
  // Appearance Tab Tests
  // ============================================================
  
  test.describe('Appearance Tab', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.click('button:has-text("Appearance"), button:has-text("การแสดงผล")');
      await page.waitForTimeout(500);
    });

    test('should display appearance settings', async ({ page }) => {
      await expect(page.locator('h2:has-text("Appearance"), h2:has-text("การแสดงผล")')).toBeVisible();
    });

    test('should have theme options', async ({ page }) => {
      await expect(page.locator('text=Light, text=สว่าง')).toBeVisible();
      await expect(page.locator('text=Dark, text=มืด')).toBeVisible();
      await expect(page.locator('text=System, text=ตามระบบ')).toBeVisible();
    });

    test('should select Light theme', async ({ page }) => {
      const lightButton = page.locator('button:has-text("Light"), button:has-text("สว่าง")');
      await lightButton.click();
      
      // Should have selected state (primary border)
      await expect(lightButton).toHaveClass(/border-primary|bg-primary/);
    });

    test('should select Dark theme', async ({ page }) => {
      const darkButton = page.locator('button:has-text("Dark"), button:has-text("มืด")');
      await darkButton.click();
      
      // Should have selected state
      await expect(darkButton).toHaveClass(/border-primary|bg-primary/);
    });

    test('should select System theme', async ({ page }) => {
      const systemButton = page.locator('button:has-text("System"), button:has-text("ตามระบบ")');
      await systemButton.click();
      
      // Should have selected state
      await expect(systemButton).toHaveClass(/border-primary|bg-primary/);
    });

    test('should save appearance settings', async ({ page }) => {
      // Select a theme
      await page.click('button:has-text("Dark"), button:has-text("มืด")');
      
      // Save
      await page.click('button:has-text("Save"), button:has-text("บันทึก")');
      
      // Wait for success
      await expect(page.locator('button:has-text("Saved"), button:has-text("บันทึกแล้ว")')).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================================
  // Language Tab Tests
  // ============================================================
  
  test.describe('Language Tab', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.click('button:has-text("Language"), button:has-text("ภาษา")');
      await page.waitForTimeout(500);
    });

    test('should display language settings', async ({ page }) => {
      await expect(page.locator('h2:has-text("Language"), h2:has-text("ภาษา")')).toBeVisible();
    });

    test('should have language dropdown', async ({ page }) => {
      const languageSelect = page.locator('select').first();
      await expect(languageSelect).toBeVisible();
      
      // Check options
      const options = languageSelect.locator('option');
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('should have timezone dropdown', async ({ page }) => {
      await expect(page.locator('text=Timezone, text=เขตเวลา')).toBeVisible();
      
      const timezoneSelect = page.locator('select').nth(1);
      await expect(timezoneSelect).toBeVisible();
    });

    test('should have date format dropdown', async ({ page }) => {
      await expect(page.locator('text=Date Format, text=รูปแบบวันที่')).toBeVisible();
      
      const dateFormatSelect = page.locator('select').nth(2);
      await expect(dateFormatSelect).toBeVisible();
    });

    test('should change language to English', async ({ page }) => {
      const languageSelect = page.locator('select').first();
      await languageSelect.selectOption('en');
      
      // Wait for UI to update
      await page.waitForTimeout(500);
      
      // Labels should be in English
      await expect(page.locator('h2:has-text("Language & Region")')).toBeVisible();
    });

    test('should change language to Thai', async ({ page }) => {
      const languageSelect = page.locator('select').first();
      await languageSelect.selectOption('th');
      
      // Wait for UI to update
      await page.waitForTimeout(500);
      
      // Labels should be in Thai
      await expect(page.locator('h2:has-text("ภาษาและภูมิภาค")')).toBeVisible();
    });

    test('should change timezone', async ({ page }) => {
      const timezoneSelect = page.locator('select').nth(1);
      await timezoneSelect.selectOption('Asia/Singapore');
      
      // Verify selected
      await expect(timezoneSelect).toHaveValue('Asia/Singapore');
    });

    test('should change date format', async ({ page }) => {
      const dateFormatSelect = page.locator('select').nth(2);
      await dateFormatSelect.selectOption('YYYY-MM-DD');
      
      // Verify selected
      await expect(dateFormatSelect).toHaveValue('YYYY-MM-DD');
    });

    test('should save language settings', async ({ page }) => {
      // Change something
      const timezoneSelect = page.locator('select').nth(1);
      await timezoneSelect.selectOption('Asia/Bangkok');
      
      // Save
      await page.click('button:has-text("Save"), button:has-text("บันทึก")');
      
      // Wait for success
      await expect(page.locator('button:has-text("Saved"), button:has-text("บันทึกแล้ว")')).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================================
  // Tab Navigation Tests
  // ============================================================
  
  test.describe('Tab Navigation', () => {
    
    test('should have 5 tabs', async ({ page }) => {
      const tabs = page.locator('button').filter({ has: page.locator('svg') });
      // Filter only sidebar tabs (not including save buttons etc)
      const sidebarTabs = page.locator('.w-48 button');
      const count = await sidebarTabs.count();
      expect(count).toBe(5);
    });

    test('should navigate between tabs', async ({ page }) => {
      // Click Notifications
      await page.click('button:has-text("Notifications"), button:has-text("การแจ้งเตือน")');
      await expect(page.locator('h2:has-text("Notification")')).toBeVisible();
      
      // Click Security
      await page.click('button:has-text("Security"), button:has-text("ความปลอดภัย")');
      await expect(page.locator('h2:has-text("Security")')).toBeVisible();
      
      // Click Appearance
      await page.click('button:has-text("Appearance"), button:has-text("การแสดงผล")');
      await expect(page.locator('h2:has-text("Appearance")')).toBeVisible();
      
      // Click Language
      await page.click('button:has-text("Language"), button:has-text("ภาษา")');
      await expect(page.locator('h2:has-text("Language")')).toBeVisible();
      
      // Click Profile
      await page.click('button:has-text("Profile"), button:has-text("โปรไฟล์")');
      await expect(page.locator('h2:has-text("Profile")')).toBeVisible();
    });

    test('should highlight active tab', async ({ page }) => {
      // Click Notifications
      await page.click('button:has-text("Notifications"), button:has-text("การแจ้งเตือน")');
      
      const notifTab = page.locator('.w-48 button:has-text("Notifications"), .w-48 button:has-text("การแจ้งเตือน")');
      await expect(notifTab).toHaveClass(/primary/);
    });
  });

  // ============================================================
  // API Integration Tests
  // ============================================================
  
  test.describe('API Integration', () => {
    
    test('should load settings from API', async ({ page }) => {
      // Check that API was called
      const response = await page.waitForResponse(
        response => response.url().includes('/settings') && response.status() === 200,
        { timeout: 10000 }
      );
      
      expect(response.ok()).toBeTruthy();
    });

    test('should save settings to API', async ({ page }) => {
      // Make a change
      const phoneInput = page.locator('input[placeholder="Optional"], input[placeholder="ไม่บังคับ"]').first();
      await phoneInput.fill('0812345678');
      
      // Listen for API call
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/auth/profile') && response.request().method() === 'PATCH'
      );
      
      // Save
      await page.click('button:has-text("Save"), button:has-text("บันทึก")');
      
      // Verify API was called
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
    });
  });

  // ============================================================
  // Error Handling Tests
  // ============================================================
  
  test.describe('Error Handling', () => {
    
    test('should show error alert and allow dismissal', async ({ page }) => {
      // Go to Security tab
      await page.click('button:has-text("Security"), button:has-text("ความปลอดภัย")');
      
      // Try to change password with wrong current password
      await page.locator('input[type="password"]').nth(0).fill('wrongpassword');
      await page.locator('input[type="password"]').nth(1).fill('newpassword123');
      await page.locator('input[type="password"]').nth(2).fill('newpassword123');
      
      await page.click('button:has-text("Change Password"), button:has-text("เปลี่ยนรหัสผ่าน")');
      
      // Should show error
      await expect(page.locator('.text-red-400, .bg-red-500')).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================================
  // Persistence Tests
  // ============================================================
  
  test.describe('Settings Persistence', () => {
    
    test('should persist theme after page refresh', async ({ page }) => {
      // Go to Appearance
      await page.click('button:has-text("Appearance"), button:has-text("การแสดงผล")');
      
      // Select Dark theme
      await page.click('button:has-text("Dark"), button:has-text("มืด")');
      
      // Save
      await page.click('button:has-text("Save"), button:has-text("บันทึก")');
      await page.waitForTimeout(2000);
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Go to Appearance again
      await page.click('button:has-text("Appearance"), button:has-text("การแสดงผล")');
      
      // Dark should be selected
      const darkButton = page.locator('button:has-text("Dark"), button:has-text("มืด")');
      await expect(darkButton).toHaveClass(/border-primary|bg-primary/);
    });

    test('should persist language after page refresh', async ({ page }) => {
      // Go to Language
      await page.click('button:has-text("Language"), button:has-text("ภาษา")');
      
      // Select English
      const languageSelect = page.locator('select').first();
      await languageSelect.selectOption('en');
      
      // Save
      await page.click('button:has-text("Save")');
      await page.waitForTimeout(2000);
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Go to Language again
      await page.click('button:has-text("Language")');
      
      // English should be selected
      await expect(page.locator('select').first()).toHaveValue('en');
      
      // Change back to Thai
      await languageSelect.selectOption('th');
      await page.click('button:has-text("Save"), button:has-text("บันทึก")');
    });
  });
});

// ============================================================
// Standalone API Tests
// ============================================================

test.describe('Settings API Tests', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get token
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: ADMIN_USER.email,
        password: ADMIN_USER.password
      }
    });
    
    const data = await response.json();
    authToken = data.access_token;
  });

  test('GET /settings - should return user settings', async ({ request }) => {
    const response = await request.get(`${API_URL}/settings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('theme');
    expect(data).toHaveProperty('language');
    expect(data).toHaveProperty('email_notifications');
  });

  test('PATCH /settings/notifications - should update notifications', async ({ request }) => {
    const response = await request.patch(`${API_URL}/settings/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        weekly_report: false
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.weekly_report).toBe(false);
  });

  test('PATCH /settings/appearance - should update theme', async ({ request }) => {
    const response = await request.patch(`${API_URL}/settings/appearance`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        theme: 'dark'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.theme).toBe('dark');
  });

  test('PATCH /settings/language - should update language', async ({ request }) => {
    const response = await request.patch(`${API_URL}/settings/language`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        language: 'th',
        timezone: 'Asia/Bangkok',
        date_format: 'DD/MM/YYYY'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.language).toBe('th');
  });

  test('POST /settings/change-password - should reject wrong password', async ({ request }) => {
    const response = await request.post(`${API_URL}/settings/change-password`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        current_password: 'wrongpassword',
        new_password: 'newpassword123',
        confirm_password: 'newpassword123'
      }
    });
    
    expect(response.status()).toBe(400);
  });

  test('GET /settings/avatar - should return avatar data', async ({ request }) => {
    const response = await request.get(`${API_URL}/settings/avatar`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('avatar_data');
    expect(data).toHaveProperty('filename');
  });
});
