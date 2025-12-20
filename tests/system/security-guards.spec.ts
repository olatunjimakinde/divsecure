import { test, expect } from '@playwright/test';
import { createTestUser } from '../utils';

test.describe('Security Guard Management', () => {
    let userEmail: string;
    let userPassword: string;

    test.beforeAll(async () => {
        const user = await createTestUser();
        userEmail = user.email;
        userPassword = user.password;
    });

    test('should add and remove a security guard', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[name="email"]', userEmail);
        await page.fill('input[name="password"]', userPassword);
        await page.click('button:has-text("Log In")');

        // Check for error messages on the page
        try {
            const errorLocator = page.locator('.text-destructive');
            if (await errorLocator.count() > 0) {
                console.error('Login Error Message:', await errorLocator.first().textContent());
            }
        } catch (e) { }

        console.log('Current URL after login submit:', page.url());

        // Wait for ANY successful login indicator (URL change or content)
        // We might be redirected to / or /communities/create depending on state
        await expect(page).not.toHaveURL('/login', { timeout: 15000 });

        // Ensure we are on the create community page
        if (!page.url().includes('/communities/create')) {
            await page.goto('/communities/create');
        }

        // 2. Create Community
        const timestamp = Date.now();
        const communityName = `Guard Test Community ${timestamp}`;
        await page.waitForSelector('input[name="name"]');
        await page.fill('input[name="name"]', communityName);
        await page.fill('input[name="address"]', '123 Test St');
        // contactNumber removed as it is not in the form
        await page.fill('input[name="slug"]', `guard-test-${timestamp}`);
        await page.click('button[type="submit"]');

        // Debug: Check for error message if redirect doesn't happen quickly
        try {
            const errorLocator = page.locator('.text-destructive');
            await errorLocator.waitFor({ state: 'visible', timeout: 3000 });
            console.error('Create Community Error:', await errorLocator.textContent());
        } catch (e) {
            // No error found within timeout, proceed to expect URL
        }

        // Wait for redirect to community page (it lands on /communities/[slug], not /manager directly)
        await expect(page).toHaveURL(/\/communities\/guard-test-\d+/);

        // 3. Navigate to Security Team directly
        await page.goto(`/communities/guard-test-${timestamp}/manager/security`);
        await expect(page.locator('h1', { hasText: 'Security Management' })).toBeVisible();

        // 4. Add Guard
        await page.click('button:has-text("Add Guard")');
        await expect(page.locator('div[role="dialog"]')).toBeVisible();

        const guardEmail = `guard.${timestamp}@example.com`;
        await page.fill('input[name="fullName"]', 'Test Guard');
        await page.fill('input[name="email"]', guardEmail);
        await page.fill('input[name="password"]', 'GuardPass123!');
        await page.click('button:has-text("Create Account")');

        // Verify Guard Added
        await expect(page.locator('div[role="dialog"]')).toBeHidden();
        await expect(page.locator('td', { hasText: 'Test Guard' })).toBeVisible();
        await expect(page.locator('td', { hasText: guardEmail })).toBeVisible();

        // 5. Remove Guard
        // Click delete button (trash icon)
        await page.click('button[title="Delete Guard"]');

        // Confirm deletion
        await expect(page.locator('div[role="alertdialog"]')).toBeVisible();
        await page.click('button:has-text("Delete")');

        // Verify Guard Removed
        await expect(page.locator('td', { hasText: guardEmail })).toBeHidden();
    });
});
